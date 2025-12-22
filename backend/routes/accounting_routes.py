"""
Accounting Routes - Accounts Receivable and Accounts Payable
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from models import User
from auth import get_current_user
from database import db
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
import uuid
import base64
import os

router = APIRouter(prefix="/accounting", tags=["Accounting"])

# Pydantic models
class ReceivableCreate(BaseModel):
    customer_name: str
    customer_email: Optional[str] = None
    invoice_number: str
    amount: float
    due_date: str
    description: Optional[str] = None
    load_reference: Optional[str] = None
    status: str = "pending"

class PayableCreate(BaseModel):
    vendor_name: str
    vendor_email: Optional[str] = None
    bill_number: str
    amount: float
    due_date: str
    description: Optional[str] = None
    category: str = "other"
    status: str = "pending"

class StatusUpdate(BaseModel):
    status: str

# ==================== ACCOUNTS RECEIVABLE ====================

@router.get("/receivables")
async def get_receivables(current_user: User = Depends(get_current_user)):
    """Get all accounts receivable for the current user's company"""
    receivables = await db.accounts_receivable.find(
        {"company_id": current_user.id},  # Use user ID as company identifier
        {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    
    return {"receivables": receivables, "total": len(receivables)}

@router.post("/receivables")
async def create_receivable(
    data: ReceivableCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new invoice/receivable"""
    # Check for duplicate invoice number
    existing = await db.accounts_receivable.find_one({
        "invoice_number": data.invoice_number,
        "company_id": current_user.id  # Use user ID as company identifier
    })
    if existing:
        raise HTTPException(status_code=400, detail="Invoice number already exists")
    
    receivable = {
        "id": str(uuid.uuid4()),
        "company_id": current_user.id,  # Use user ID as company identifier
        "customer_name": data.customer_name,
        "customer_email": data.customer_email,
        "invoice_number": data.invoice_number,
        "amount": data.amount,
        "amount_paid": 0,
        "due_date": data.due_date,
        "description": data.description,
        "load_reference": data.load_reference,
        "status": data.status,
        "created_by": current_user.id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.accounts_receivable.insert_one(receivable)
    receivable.pop("_id", None)
    
    return {"message": "Invoice created successfully", "receivable": receivable}

@router.put("/receivables/{receivable_id}")
async def update_receivable(
    receivable_id: str,
    data: StatusUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update receivable status"""
    result = await db.accounts_receivable.update_one(
        {"id": receivable_id, "company_id": current_user.id},  # Use user ID as company identifier
        {
            "$set": {
                "status": data.status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Receivable not found")
    
    return {"message": "Status updated successfully"}

@router.delete("/receivables/{receivable_id}")
async def delete_receivable(
    receivable_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a receivable"""
    result = await db.accounts_receivable.delete_one({
        "id": receivable_id,
        "company_id": current_user.id  # Use user ID as company identifier
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Receivable not found")
    
    return {"message": "Invoice deleted successfully"}

# ==================== ACCOUNTS PAYABLE ====================

@router.get("/payables")
async def get_payables(current_user: User = Depends(get_current_user)):
    """Get all accounts payable for the current user's company"""
    payables = await db.accounts_payable.find(
        {"company_id": current_user.id},  # Use user ID as company identifier
        {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    
    return {"payables": payables, "total": len(payables)}

@router.post("/payables")
async def create_payable(
    data: PayableCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new bill/payable"""
    # Check for duplicate bill number
    existing = await db.accounts_payable.find_one({
        "bill_number": data.bill_number,
        "company_id": current_user.id  # Use user ID as company identifier
    })
    if existing:
        raise HTTPException(status_code=400, detail="Bill number already exists")
    
    payable = {
        "id": str(uuid.uuid4()),
        "company_id": current_user.id,  # Use user ID as company identifier
        "vendor_name": data.vendor_name,
        "vendor_email": data.vendor_email,
        "bill_number": data.bill_number,
        "amount": data.amount,
        "amount_paid": 0,
        "due_date": data.due_date,
        "description": data.description,
        "category": data.category,
        "status": data.status,
        "created_by": current_user.id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.accounts_payable.insert_one(payable)
    payable.pop("_id", None)
    
    return {"message": "Bill created successfully", "payable": payable}

@router.put("/payables/{payable_id}")
async def update_payable(
    payable_id: str,
    data: StatusUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update payable status"""
    result = await db.accounts_payable.update_one(
        {"id": payable_id, "company_id": current_user.id},  # Use user ID as company identifier
        {
            "$set": {
                "status": data.status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Payable not found")
    
    return {"message": "Status updated successfully"}

@router.delete("/payables/{payable_id}")
async def delete_payable(
    payable_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a payable"""
    result = await db.accounts_payable.delete_one({
        "id": payable_id,
        "company_id": current_user.id  # Use user ID as company identifier
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payable not found")
    
    return {"message": "Bill deleted successfully"}

# ==================== SUMMARY ====================

@router.get("/summary")
async def get_accounting_summary(current_user: User = Depends(get_current_user)):
    """Get accounting summary statistics"""
    company_id = current_user.id  # Use user ID as company identifier
    
    # AR totals
    ar_pipeline = [
        {"$match": {"company_id": company_id}},
        {"$group": {
            "_id": "$status",
            "total": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    ar_stats = await db.accounts_receivable.aggregate(ar_pipeline).to_list(100)
    
    # AP totals
    ap_pipeline = [
        {"$match": {"company_id": company_id}},
        {"$group": {
            "_id": "$status",
            "total": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    ap_stats = await db.accounts_payable.aggregate(ap_pipeline).to_list(100)
    
    return {
        "accounts_receivable": {stat["_id"]: {"total": stat["total"], "count": stat["count"]} for stat in ar_stats},
        "accounts_payable": {stat["_id"]: {"total": stat["total"], "count": stat["count"]} for stat in ap_stats}
    }


# ==================== RECEIPT PARSING ====================

@router.post("/parse-receipt")
async def parse_receipt(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Parse receipt image using AI to extract financial data"""
    try:
        # Read the file
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode('utf-8')
        
        # Determine mime type
        content_type = file.content_type or 'image/jpeg'
        
        # Use OpenAI Vision API to parse the receipt
        try:
            from emergentintegrations.llm.chat import chat, LlmModel
            
            prompt = """Analyze this receipt/invoice image and extract the following information in JSON format:
            {
                "party_name": "Name of the vendor/customer/company on the receipt",
                "amount": 0.00,
                "date": "YYYY-MM-DD",
                "document_number": "Invoice/Receipt number if visible",
                "description": "Brief description of items/services",
                "category": "fuel/maintenance/insurance/tolls/supplies/other",
                "is_expense": true/false (true if it's a bill/expense to pay, false if it's income/payment received),
                "email": "Email if visible on receipt",
                "reference": "Any reference number like PO, Load#, etc."
            }
            
            Return ONLY valid JSON, no other text. If a field is not found, use null.
            For amount, extract the total/grand total amount as a number without currency symbols.
            For is_expense: true means this is a bill/expense (Accounts Payable), false means it's income (Accounts Receivable).
            """
            
            response = await chat(
                model=LlmModel.GPT4O,
                system_message="You are a receipt/invoice parsing assistant. Extract financial data from images accurately.",
                user_message=prompt,
                image_urls=[f"data:{content_type};base64,{base64_image}"]
            )
            
            # Parse the response
            import json
            import re
            
            # Try to extract JSON from the response
            response_text = response.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith('```'):
                response_text = re.sub(r'^```(?:json)?\s*', '', response_text)
                response_text = re.sub(r'\s*```$', '', response_text)
            
            parsed_data = json.loads(response_text)
            
            # Determine suggested type based on is_expense flag
            suggested_type = 'ap' if parsed_data.get('is_expense', True) else 'ar'
            
            return {
                "parsed_data": {
                    "party_name": parsed_data.get('party_name'),
                    "amount": parsed_data.get('amount'),
                    "date": parsed_data.get('date'),
                    "document_number": parsed_data.get('document_number'),
                    "description": parsed_data.get('description'),
                    "category": parsed_data.get('category', 'other'),
                    "email": parsed_data.get('email'),
                    "reference": parsed_data.get('reference')
                },
                "suggested_type": suggested_type
            }
            
        except ImportError:
            # Fallback if emergentintegrations not available
            raise HTTPException(
                status_code=500, 
                detail="AI integration not configured. Please install emergentintegrations."
            )
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse AI response: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process receipt: {str(e)}")
