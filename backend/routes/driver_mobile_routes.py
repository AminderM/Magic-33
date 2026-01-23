from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from models import User, UserRole, UserLogin
from auth import get_current_user, verify_password, create_access_token
from database import db
from datetime import datetime, timezone
from typing import List, Optional
import uuid
import os
import base64

router = APIRouter(prefix="/driver-mobile", tags=["Driver Mobile App"])

# ============== AUTHENTICATION ==============

@router.post("/login")
async def driver_mobile_login(credentials: UserLogin):
    """Driver login for mobile app - validates driver role"""
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if user.get("role") != UserRole.DRIVER:
        raise HTTPException(status_code=403, detail="Access denied. Driver role required.")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is deactivated")
    
    access_token = create_access_token(data={"sub": user["id"], "role": user["role"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "phone": user.get("phone", ""),
            "fleet_owner_id": user.get("fleet_owner_id")
        }
    }

@router.get("/me")
async def get_driver_info(current_user: User = Depends(get_current_user)):
    """Get current driver information"""
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(status_code=403, detail="Driver access only")
    
    user_data = await db.users.find_one({"id": current_user.id}, {"_id": 0, "password_hash": 0})
    return user_data

# ============== LOADS ==============

@router.get("/loads")
async def get_driver_loads(current_user: User = Depends(get_current_user)):
    """Get all loads assigned to the driver"""
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(status_code=403, detail="Driver access only")
    
    loads = await db.loads.find(
        {"assigned_driver_id": current_user.id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Also check bookings collection for backward compatibility
    bookings = await db.bookings.find(
        {"driver_id": current_user.id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Merge and return
    all_loads = loads + bookings
    return all_loads

@router.get("/loads/{load_id}")
async def get_load_detail(load_id: str, current_user: User = Depends(get_current_user)):
    """Get detailed load information - only if assigned to driver"""
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(status_code=403, detail="Driver access only")
    
    # Check loads collection
    load = await db.loads.find_one(
        {"id": load_id, "assigned_driver_id": current_user.id},
        {"_id": 0}
    )
    
    # Fallback to bookings
    if not load:
        load = await db.bookings.find_one(
            {"id": load_id, "driver_id": current_user.id},
            {"_id": 0}
        )
    
    if not load:
        raise HTTPException(status_code=404, detail="Load not found or not assigned to you")
    
    return load

# ============== STATUS WORKFLOW ==============

VALID_STATUSES = [
    "assigned",
    "en_route_pickup",
    "arrived_pickup",
    "loaded",
    "en_route_delivery",
    "arrived_delivery",
    "delivered",
    "problem"
]

STATUS_TRANSITIONS = {
    "assigned": ["en_route_pickup"],
    "en_route_pickup": ["arrived_pickup"],
    "arrived_pickup": ["loaded"],
    "loaded": ["en_route_delivery"],
    "en_route_delivery": ["arrived_delivery"],
    "arrived_delivery": ["delivered"],
    "delivered": [],
    "problem": VALID_STATUSES  # Can transition to any status from problem
}

@router.post("/loads/{load_id}/status")
async def update_load_status(
    load_id: str,
    status_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Update load status with validation and event logging"""
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(status_code=403, detail="Driver access only")
    
    new_status = status_data.get("status")
    note = status_data.get("note", "")
    latitude = status_data.get("latitude")
    longitude = status_data.get("longitude")
    
    if new_status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {new_status}")
    
    if new_status == "problem" and not note:
        raise HTTPException(status_code=400, detail="Note is required for problem status")
    
    # Get current load
    load = await db.loads.find_one({"id": load_id, "assigned_driver_id": current_user.id})
    collection = "loads"
    
    if not load:
        load = await db.bookings.find_one({"id": load_id, "driver_id": current_user.id})
        collection = "bookings"
    
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    
    current_status = load.get("status", "assigned")
    
    # Validate transition (drivers can only move forward, except for problem)
    if new_status != "problem" and current_status != "problem":
        allowed_transitions = STATUS_TRANSITIONS.get(current_status, [])
        if new_status not in allowed_transitions and new_status != current_status:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot transition from {current_status} to {new_status}"
            )
    
    # Create status event
    event = {
        "id": str(uuid.uuid4()),
        "load_id": load_id,
        "driver_id": current_user.id,
        "previous_status": current_status,
        "new_status": new_status,
        "note": note,
        "latitude": latitude,
        "longitude": longitude,
        "created_at": datetime.now(timezone.utc)
    }
    await db.load_status_events.insert_one(event)
    
    # Update load status
    update_data = {
        "status": new_status,
        "last_status_update": datetime.now(timezone.utc),
        "last_status_note": note
    }
    
    if new_status == "arrived_pickup":
        update_data["actual_pickup_arrival"] = datetime.now(timezone.utc)
    elif new_status == "loaded":
        update_data["actual_pickup_departure"] = datetime.now(timezone.utc)
    elif new_status == "arrived_delivery":
        update_data["actual_delivery_arrival"] = datetime.now(timezone.utc)
    elif new_status == "delivered":
        update_data["actual_delivery_time"] = datetime.now(timezone.utc)
    
    if collection == "loads":
        await db.loads.update_one({"id": load_id}, {"$set": update_data})
    else:
        await db.bookings.update_one({"id": load_id}, {"$set": update_data})
    
    return {
        "message": "Status updated successfully",
        "status": new_status,
        "event_id": event["id"]
    }

@router.get("/loads/{load_id}/status-history")
async def get_status_history(load_id: str, current_user: User = Depends(get_current_user)):
    """Get status change history for a load"""
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(status_code=403, detail="Driver access only")
    
    events = await db.load_status_events.find(
        {"load_id": load_id, "driver_id": current_user.id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return events

# ============== MESSAGING ==============

@router.get("/loads/{load_id}/messages")
async def get_load_messages(load_id: str, current_user: User = Depends(get_current_user)):
    """Get all messages for a load"""
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(status_code=403, detail="Driver access only")
    
    # Verify driver is assigned to this load
    load = await db.loads.find_one({"id": load_id, "assigned_driver_id": current_user.id})
    if not load:
        load = await db.bookings.find_one({"id": load_id, "driver_id": current_user.id})
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    
    messages = await db.load_messages.find(
        {"load_id": load_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    
    # Mark messages as read by driver
    await db.load_messages.update_many(
        {"load_id": load_id, "sender_type": "dispatch", "read_by_driver": False},
        {"$set": {"read_by_driver": True, "read_at": datetime.now(timezone.utc)}}
    )
    
    return messages

@router.post("/loads/{load_id}/messages")
async def send_message(
    load_id: str,
    message_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Send a message to dispatch for a load"""
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(status_code=403, detail="Driver access only")
    
    # Verify driver is assigned
    load = await db.loads.find_one({"id": load_id, "assigned_driver_id": current_user.id})
    if not load:
        load = await db.bookings.find_one({"id": load_id, "driver_id": current_user.id})
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    
    message = {
        "id": str(uuid.uuid4()),
        "load_id": load_id,
        "sender_id": current_user.id,
        "sender_name": current_user.full_name,
        "sender_type": "driver",
        "content": message_data.get("content", ""),
        "image_url": message_data.get("image_url"),
        "read_by_dispatch": False,
        "read_by_driver": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.load_messages.insert_one(message)
    
    return {"message": "Message sent", "data": {**message, "_id": None}}

@router.get("/messages/unread-count")
async def get_unread_count(current_user: User = Depends(get_current_user)):
    """Get count of unread messages across all loads"""
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(status_code=403, detail="Driver access only")
    
    # Get driver's load IDs
    loads = await db.loads.find(
        {"assigned_driver_id": current_user.id},
        {"id": 1}
    ).to_list(100)
    load_ids = [l["id"] for l in loads]
    
    bookings = await db.bookings.find(
        {"driver_id": current_user.id},
        {"id": 1}
    ).to_list(100)
    load_ids.extend([b["id"] for b in bookings])
    
    count = await db.load_messages.count_documents({
        "load_id": {"$in": load_ids},
        "sender_type": "dispatch",
        "read_by_driver": False
    })
    
    return {"unread_count": count}

# ============== DOCUMENTS ==============

@router.get("/loads/{load_id}/documents")
async def get_load_documents(load_id: str, current_user: User = Depends(get_current_user)):
    """Get all documents for a load"""
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(status_code=403, detail="Driver access only")
    
    # Verify assignment
    load = await db.loads.find_one({"id": load_id, "assigned_driver_id": current_user.id})
    if not load:
        load = await db.bookings.find_one({"id": load_id, "driver_id": current_user.id})
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    
    documents = await db.load_documents.find(
        {"load_id": load_id},
        {"_id": 0}
    ).sort("uploaded_at", -1).to_list(100)
    
    return documents

@router.post("/loads/{load_id}/documents")
async def upload_document(
    load_id: str,
    doc_type: str = Form(...),
    stop_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload a document for a load"""
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(status_code=403, detail="Driver access only")
    
    # Verify assignment
    load = await db.loads.find_one({"id": load_id, "assigned_driver_id": current_user.id})
    if not load:
        load = await db.bookings.find_one({"id": load_id, "driver_id": current_user.id})
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    
    valid_doc_types = ["bol", "pod", "lumper", "scale_ticket", "other"]
    if doc_type.lower() not in valid_doc_types:
        raise HTTPException(status_code=400, detail=f"Invalid doc_type. Must be one of: {valid_doc_types}")
    
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    # Store as base64 for simplicity (can upgrade to cloud storage later)
    file_base64 = base64.b64encode(content).decode('utf-8')
    
    document = {
        "id": str(uuid.uuid4()),
        "load_id": load_id,
        "stop_id": stop_id,
        "doc_type": doc_type.lower(),
        "filename": file.filename,
        "content_type": file.content_type,
        "file_size": file_size,
        "file_data": file_base64,
        "uploaded_by": current_user.id,
        "uploader_name": current_user.full_name,
        "uploaded_at": datetime.now(timezone.utc)
    }
    
    await db.load_documents.insert_one(document)
    
    # Return without file_data
    return {
        "message": "Document uploaded successfully",
        "document": {
            "id": document["id"],
            "load_id": load_id,
            "doc_type": doc_type,
            "filename": file.filename,
            "uploaded_at": document["uploaded_at"]
        }
    }

@router.get("/documents/{doc_id}")
async def get_document(doc_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific document with file data"""
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(status_code=403, detail="Driver access only")
    
    doc = await db.load_documents.find_one({"id": doc_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Verify driver has access to this load
    load = await db.loads.find_one({"id": doc["load_id"], "assigned_driver_id": current_user.id})
    if not load:
        load = await db.bookings.find_one({"id": doc["load_id"], "driver_id": current_user.id})
    if not load:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return doc

# ============== LOCATION TRACKING ==============

@router.post("/location/ping")
async def ping_location(
    location_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Record driver location ping"""
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(status_code=403, detail="Driver access only")
    
    location = {
        "id": str(uuid.uuid4()),
        "driver_id": current_user.id,
        "load_id": location_data.get("load_id"),
        "lat": location_data.get("lat"),
        "lng": location_data.get("lng"),
        "accuracy_m": location_data.get("accuracy_m"),
        "speed_mps": location_data.get("speed_mps"),
        "heading_deg": location_data.get("heading_deg"),
        "recorded_at": datetime.now(timezone.utc),
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.driver_locations.insert_one(location)
    
    # Update driver's last known location
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {
            "last_location_lat": location["lat"],
            "last_location_lng": location["lng"],
            "last_location_at": location["recorded_at"],
            "last_accuracy_m": location["accuracy_m"]
        }}
    )
    
    return {"message": "Location recorded", "id": location["id"]}

@router.get("/location/latest")
async def get_my_latest_location(current_user: User = Depends(get_current_user)):
    """Get driver's latest recorded location"""
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(status_code=403, detail="Driver access only")
    
    location = await db.driver_locations.find_one(
        {"driver_id": current_user.id},
        {"_id": 0},
        sort=[("recorded_at", -1)]
    )
    
    return location or {}

# ============== PROFILE ==============

@router.put("/profile")
async def update_profile(
    profile_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Update driver profile"""
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(status_code=403, detail="Driver access only")
    
    allowed_fields = ["phone", "full_name"]
    update_data = {k: v for k, v in profile_data.items() if k in allowed_fields}
    
    if update_data:
        await db.users.update_one(
            {"id": current_user.id},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"id": current_user.id}, {"_id": 0, "password_hash": 0})
    return updated_user
