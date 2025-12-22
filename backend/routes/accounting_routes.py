"""
Accounting Routes - Accounts Receivable and Accounts Payable
"""
from fastapi import APIRouter, HTTPException, Depends
from models import User
from auth import get_current_user
from database import db
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
import uuid

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
        {"company_id": current_user.company_id or current_user.id},
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
        "company_id": current_user.company_id or current_user.id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Bill number already exists")
    
    payable = {
        "id": str(uuid.uuid4()),
        "company_id": current_user.company_id or current_user.id,
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
        {"id": payable_id, "company_id": current_user.company_id or current_user.id},
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
        "company_id": current_user.company_id or current_user.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payable not found")
    
    return {"message": "Bill deleted successfully"}

# ==================== SUMMARY ====================

@router.get("/summary")
async def get_accounting_summary(current_user: User = Depends(get_current_user)):
    """Get accounting summary statistics"""
    company_id = current_user.company_id or current_user.id
    
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
