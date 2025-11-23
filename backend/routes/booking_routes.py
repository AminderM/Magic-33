from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, BackgroundTasks
from models import *
from auth import get_current_user
from database import db
from datetime import datetime, timezone
from typing import List, Literal
from email_service import send_booking_confirmation_emails
import base64
import logging
import traceback

router = APIRouter(prefix="/bookings", tags=["Bookings"])
logger = logging.getLogger(__name__)

@router.post("", response_model=dict)
async def create_booking(booking_data: BookingCreate, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user)):
    # Get equipment details
    equipment = await db.equipment.find_one({"id": booking_data.equipment_id})
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    if not equipment["is_available"]:
        raise HTTPException(status_code=400, detail="Equipment is not available")
    
    # Get equipment owner details
    provider = await db.users.find_one({"id": equipment["owner_id"]})
    if not provider:
        raise HTTPException(status_code=404, detail="Equipment owner not found")
    
    # Calculate total cost
    duration_days = (booking_data.end_date - booking_data.start_date).days
    if duration_days < 1:
        duration_days = 1  # Minimum 1 day
    total_cost = duration_days * equipment["daily_rate"]
    
    # Create booking
    booking_dict = booking_data.dict()
    booking_dict["requester_id"] = current_user.id
    booking_dict["equipment_owner_id"] = equipment["owner_id"]
    booking_dict["total_cost"] = total_cost
    booking_obj = Booking(**booking_dict)
    
    await db.bookings.insert_one(booking_obj.dict())
    
    # Send booking confirmation emails
    booking_details = {
        "equipment_name": equipment["name"],
        "start_date": booking_data.start_date.strftime("%B %d, %Y at %I:%M %p"),
        "end_date": booking_data.end_date.strftime("%B %d, %Y at %I:%M %p"),
        "pickup_location": booking_data.pickup_location,
        "delivery_location": booking_data.delivery_location,
        "total_cost": total_cost,
        "booking_id": booking_obj.id[:8] + "...",
        "notes": booking_data.notes or "No special requirements"
    }
    
    await send_booking_confirmation_emails(
        background_tasks,
        current_user.email,
        current_user.full_name,
        provider["email"],
        provider["full_name"],
        booking_details
    )
    
    return {
        "message": "Booking request created successfully! Confirmation emails sent.", 
        "booking_id": booking_obj.id, 
        "total_cost": total_cost
    }

@router.get("/my", response_model=List[Booking])
async def get_my_bookings(current_user: User = Depends(get_current_user)):
    bookings = await db.bookings.find({"requester_id": current_user.id}).to_list(length=None)
    return [Booking(**booking) for booking in bookings]

@router.get("/requests", response_model=List[Booking])
async def get_booking_requests(current_user: User = Depends(get_current_user)):
    bookings = await db.bookings.find({"equipment_owner_id": current_user.id}).to_list(length=None)
    return [Booking(**booking) for booking in bookings]

@router.patch("/bookings/{booking_id}/status", response_model=dict)
async def update_booking_status(
    booking_id: str, 
    status: Literal["pending", "planned", "in_transit_pickup", "at_pickup", "in_transit_delivery", "at_delivery", "delivered", "invoiced", "payment_overdue", "paid"],
    current_user: User = Depends(get_current_user)
):
    # Find the booking
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user has permission to update (either requester or equipment owner)
    if booking["requester_id"] != current_user.id and booking["equipment_owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this booking")
    
    # Update the status
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": status}}
    )
    
    return {"message": "Status updated successfully", "status": status}

@router.put("/bookings/{booking_id}", response_model=Booking)
async def update_booking(
    booking_id: str,
    booking_update: BookingCreate,
    current_user: User = Depends(get_current_user)
):
    # Find the booking
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user has permission to update
    if booking["requester_id"] != current_user.id and booking["equipment_owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this booking")
    
    # Only allow editing if status is pending
    if booking.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Only bookings with 'pending' status can be edited")
    
    # Update the booking
    update_data = booking_update.dict(exclude_unset=True)
    
    # Convert datetime fields to ISO format strings for MongoDB
    for field in ['pickup_time_planned', 'delivery_time_planned', 'start_date', 'end_date']:
        if field in update_data and update_data[field]:
            if isinstance(update_data[field], datetime):
                update_data[field] = update_data[field].isoformat()
    
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": update_data}
    )
    
    # Get updated booking
    updated_booking = await db.bookings.find_one({"id": booking_id})
    return Booking(**updated_booking)

@router.post("/bookings/parse-rate-confirmation", response_model=dict)
async def parse_rate_confirmation(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Parse a rate confirmation document using AI to extract order information
    """
    logger.info(f"Parsing rate confirmation: filename={file.filename}, content_type={file.content_type}")
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType
        import tempfile
        import shutil
        
        # Validate file type
        allowed_types = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        if file.content_type not in allowed_types:
            logger.error(f"Invalid file type: {file.content_type}")
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}. Only PDF and image files (JPEG, PNG) are supported.")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_file_path = temp_file.name
        
        try:
            # Initialize AI chat with Gemini
            api_key = os.environ.get('EMERGENT_LLM_KEY')
            if not api_key:
                raise HTTPException(status_code=500, detail="AI service not configured")
            
            chat = LlmChat(
                api_key=api_key,
                session_id=f"rate-conf-{current_user.id}",
                system_message="You are an AI assistant specialized in extracting structured data from shipping and logistics documents."
            ).with_model("gemini", "gemini-2.0-flash")
            
            # Prepare file for analysis
            file_content = FileContentWithMimeType(
                file_path=temp_file_path,
                mime_type=file.content_type
            )
            
            # Create detailed extraction prompt
            extraction_prompt = """
Analyze this rate confirmation or shipping document and extract the following information. 
Return the data in JSON format with these exact field names:

{
  "shipper_name": "name of the shipper/sender",
  "shipper_address": "full address of shipper",
  "pickup_location": "pickup street address",
  "pickup_city": "pickup city",
  "pickup_state": "pickup state",
  "pickup_country": "pickup country (default USA if not specified)",
  "delivery_location": "delivery street address",
  "delivery_city": "delivery city",
  "delivery_state": "delivery state",
  "delivery_country": "delivery country (default USA if not specified)",
  "commodity": "type of goods being shipped",
  "weight": "weight in pounds (number only)",
  "cubes": "cubic feet (number only)",
  "tractor_number": "tractor number if available",
  "trailer_number": "trailer number if available",
  "driver_name": "driver name if available",
  "driver_id": "driver ID if available",
  "pickup_time_planned": "planned pickup date and time in ISO format (YYYY-MM-DDTHH:MM:SS)",
  "delivery_time_planned": "planned delivery date and time in ISO format (YYYY-MM-DDTHH:MM:SS)",
  "confirmed_rate": "the confirmed rate or total charge amount in dollars (number only, extract from fields like 'Rate', 'Total', 'Charge', 'Amount', or similar)",
  "notes": "any additional notes or special instructions"
}

IMPORTANT: For confirmed_rate, look for monetary values labeled as:
- "Rate"
- "Total Rate"
- "Confirmed Rate" 
- "Total Charge"
- "Amount"
- "Total Amount"
- "Line Haul"
- Any dollar amount that represents the shipping cost

Extract only the numeric value without dollar signs or commas.

If a field is not found in the document, set it to null. 
Return ONLY the JSON object, no additional text or explanation.
"""
            
            # Send message with file
            user_message = UserMessage(
                text=extraction_prompt,
                file_contents=[file_content]
            )
            
            response = await chat.send_message(user_message)
            
            logger.info(f"AI response received, length: {len(response)}")
            
            # Parse the AI response
            response_text = response.strip()
            
            # Try to extract JSON from response
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()
            
            try:
                extracted_data = json.loads(response_text)
                logger.info(f"Successfully extracted data: {list(extracted_data.keys())}")
            except json.JSONDecodeError as e:
                logger.error(f"JSON parse error: {e}, response: {response_text[:500]}")
                raise HTTPException(status_code=500, detail=f"Failed to parse AI response as JSON. AI returned: {response_text[:200]}")
            
            return {
                "success": True,
                "data": extracted_data,
                "message": "Document parsed successfully"
            }
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        logger.error(f"Error parsing rate confirmation: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error parsing document: {str(e)}")

