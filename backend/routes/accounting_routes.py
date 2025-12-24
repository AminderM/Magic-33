"""
Accounting Routes - Accounts Receivable and Accounts Payable
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from models import User
from auth import get_current_user
from database import db
from datetime import datetime, timezone, timedelta
from typing import Optional, List
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
    load_reference: Optional[str] = None
    status: str = "pending"

class StatusUpdate(BaseModel):
    status: str

# Expense Categories for Trucking/Transport industry
EXPENSE_CATEGORIES = [
    "fuel",
    "repairs_maintenance", 
    "tires",
    "parts_supplies",
    "tolls",
    "permits_licenses",
    "parking",
    "driver_meals",
    "lodging",
    "scale_fees",
    "lumper_fees",
    "detention_fees",
    "insurance",
    "registration",
    "cleaning",
    "communication",
    "office_supplies",
    "professional_services",
    "other"
]

class ExpenseCreate(BaseModel):
    vendor_name: str
    expense_date: str
    amount: float
    category: str = "other"
    receipt_number: Optional[str] = None
    description: Optional[str] = None
    payment_method: Optional[str] = None
    # Linking options
    load_reference: Optional[str] = None
    driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    vehicle_id: Optional[str] = None
    vehicle_name: Optional[str] = None
    # Line items for detailed receipts
    line_items: Optional[List[dict]] = None
    # Receipt image reference
    receipt_image_url: Optional[str] = None

class ExpenseUpdate(BaseModel):
    vendor_name: Optional[str] = None
    expense_date: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    receipt_number: Optional[str] = None
    description: Optional[str] = None
    payment_method: Optional[str] = None
    load_reference: Optional[str] = None
    driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    vehicle_id: Optional[str] = None
    vehicle_name: Optional[str] = None

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

class PaymentRecord(BaseModel):
    amount: float
    payment_method: str = "check"  # check, wire, ach, card, cash
    reference_number: Optional[str] = None
    notes: Optional[str] = None

@router.post("/receivables/{receivable_id}/payments")
async def record_ar_payment(
    receivable_id: str,
    payment: PaymentRecord,
    current_user: User = Depends(get_current_user)
):
    """Record a payment for an accounts receivable item"""
    receivable = await db.accounts_receivable.find_one({
        "id": receivable_id,
        "company_id": current_user.id
    })
    
    if not receivable:
        raise HTTPException(status_code=404, detail="Receivable not found")
    
    # Create payment record
    payment_entry = {
        "id": str(uuid.uuid4()),
        "amount": payment.amount,
        "payment_method": payment.payment_method,
        "reference_number": payment.reference_number,
        "notes": payment.notes,
        "recorded_by": current_user.id,
        "recorded_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Calculate new amount_paid
    current_paid = receivable.get("amount_paid", 0) or 0
    new_paid = current_paid + payment.amount
    total_amount = receivable.get("amount", 0)
    
    # Determine new status
    if new_paid >= total_amount:
        new_status = "paid"
    elif new_paid > 0:
        new_status = "partial"
    else:
        new_status = receivable.get("status", "pending")
    
    # Update receivable
    await db.accounts_receivable.update_one(
        {"id": receivable_id, "company_id": current_user.id},
        {
            "$set": {
                "amount_paid": new_paid,
                "status": new_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$push": {"payments": payment_entry}
        }
    )
    
    return {
        "message": "Payment recorded successfully",
        "payment": payment_entry,
        "amount_paid": new_paid,
        "amount_remaining": max(0, total_amount - new_paid),
        "status": new_status
    }

@router.get("/receivables/{receivable_id}/payments")
async def get_ar_payment_history(
    receivable_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get payment history for an accounts receivable item"""
    receivable = await db.accounts_receivable.find_one(
        {"id": receivable_id, "company_id": current_user.id},
        {"_id": 0}
    )
    
    if not receivable:
        raise HTTPException(status_code=404, detail="Receivable not found")
    
    return {
        "receivable_id": receivable_id,
        "invoice_number": receivable.get("invoice_number"),
        "total_amount": receivable.get("amount", 0),
        "amount_paid": receivable.get("amount_paid", 0),
        "amount_remaining": max(0, (receivable.get("amount", 0) - receivable.get("amount_paid", 0))),
        "payments": receivable.get("payments", [])
    }

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
        "load_reference": data.load_reference,
        "category": data.category,
        "status": data.status,
        "created_by": current_user.id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.accounts_payable.insert_one(payable)
    payable.pop("_id", None)
    
    return {"message": "Bill created successfully", "payable": payable}

@router.post("/payables/{payable_id}/payments")
async def record_ap_payment(
    payable_id: str,
    payment: PaymentRecord,
    current_user: User = Depends(get_current_user)
):
    """Record a payment for an accounts payable item"""
    payable = await db.accounts_payable.find_one({
        "id": payable_id,
        "company_id": current_user.id
    })
    
    if not payable:
        raise HTTPException(status_code=404, detail="Payable not found")
    
    # Create payment record
    payment_entry = {
        "id": str(uuid.uuid4()),
        "amount": payment.amount,
        "payment_method": payment.payment_method,
        "reference_number": payment.reference_number,
        "notes": payment.notes,
        "recorded_by": current_user.id,
        "recorded_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Calculate new amount_paid
    current_paid = payable.get("amount_paid", 0) or 0
    new_paid = current_paid + payment.amount
    total_amount = payable.get("amount", 0)
    
    # Determine new status
    if new_paid >= total_amount:
        new_status = "paid"
    elif new_paid > 0:
        new_status = "partial"
    else:
        new_status = payable.get("status", "pending")
    
    # Update payable
    await db.accounts_payable.update_one(
        {"id": payable_id, "company_id": current_user.id},
        {
            "$set": {
                "amount_paid": new_paid,
                "status": new_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$push": {"payments": payment_entry}
        }
    )
    
    return {
        "message": "Payment recorded successfully",
        "payment": payment_entry,
        "amount_paid": new_paid,
        "amount_remaining": max(0, total_amount - new_paid),
        "status": new_status
    }

@router.get("/payables/{payable_id}/payments")
async def get_ap_payment_history(
    payable_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get payment history for an accounts payable item"""
    payable = await db.accounts_payable.find_one(
        {"id": payable_id, "company_id": current_user.id},
        {"_id": 0}
    )
    
    if not payable:
        raise HTTPException(status_code=404, detail="Payable not found")
    
    return {
        "payable_id": payable_id,
        "bill_number": payable.get("bill_number"),
        "total_amount": payable.get("amount", 0),
        "amount_paid": payable.get("amount_paid", 0),
        "amount_remaining": max(0, (payable.get("amount", 0) - payable.get("amount_paid", 0))),
        "payments": payable.get("payments", [])
    }

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


# ==================== INCOME (Received AR Payments) ====================

@router.get("/income")
async def get_income(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get income entries - AR payments that have been received (paid or partial)"""
    query = {
        "company_id": current_user.id,
        "$or": [
            {"status": "paid"},
            {"status": "partial"},
            {"amount_paid": {"$gt": 0}}
        ]
    }
    
    if status:
        if status == "fully_paid":
            query = {"company_id": current_user.id, "status": "paid"}
        elif status == "partial":
            query = {"company_id": current_user.id, "status": "partial"}
    
    income_entries = await db.accounts_receivable.find(
        query,
        {"_id": 0}
    ).sort("updated_at", -1).to_list(1000)
    
    # Calculate totals
    total_received = sum(e.get("amount_paid", 0) or 0 for e in income_entries)
    total_invoiced = sum(e.get("amount", 0) or 0 for e in income_entries)
    total_outstanding = total_invoiced - total_received
    fully_paid_count = sum(1 for e in income_entries if e.get("status") == "paid")
    partial_count = sum(1 for e in income_entries if e.get("status") == "partial")
    
    return {
        "income": income_entries,
        "summary": {
            "total_entries": len(income_entries),
            "fully_paid_count": fully_paid_count,
            "partial_count": partial_count,
            "total_received": total_received,
            "total_invoiced": total_invoiced,
            "total_outstanding": total_outstanding
        }
    }

@router.get("/income/summary")
async def get_income_summary(
    current_user: User = Depends(get_current_user)
):
    """Get income summary by category/load/customer"""
    company_id = current_user.id
    
    # Get all paid/partial AR entries
    income_entries = await db.accounts_receivable.find({
        "company_id": company_id,
        "$or": [
            {"status": "paid"},
            {"status": "partial"},
            {"amount_paid": {"$gt": 0}}
        ]
    }, {"_id": 0}).to_list(1000)
    
    # Group by customer
    by_customer = {}
    for entry in income_entries:
        customer = entry.get("customer_name", "Unknown")
        if customer not in by_customer:
            by_customer[customer] = {"received": 0, "invoiced": 0, "count": 0}
        by_customer[customer]["received"] += entry.get("amount_paid", 0) or 0
        by_customer[customer]["invoiced"] += entry.get("amount", 0) or 0
        by_customer[customer]["count"] += 1
    
    # Group by load (for load-linked invoices)
    by_load = {}
    for entry in income_entries:
        load_ref = entry.get("load_reference")
        if load_ref:
            if load_ref not in by_load:
                by_load[load_ref] = {"received": 0, "invoiced": 0, "customer": entry.get("customer_name")}
            by_load[load_ref]["received"] += entry.get("amount_paid", 0) or 0
            by_load[load_ref]["invoiced"] += entry.get("amount", 0) or 0
    
    return {
        "by_customer": by_customer,
        "by_load": by_load
    }


# ==================== EXPENSES LEDGER ====================

@router.get("/expenses")
async def get_expenses(
    status: Optional[str] = None,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get all expenses for the current user's company"""
    query = {"company_id": current_user.id}
    
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    
    expenses = await db.expenses.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    # Calculate totals
    pending_total = sum(e.get("amount", 0) for e in expenses if e.get("status") == "pending")
    approved_total = sum(e.get("amount", 0) for e in expenses if e.get("status") == "approved")
    
    return {
        "expenses": expenses,
        "summary": {
            "total_count": len(expenses),
            "pending_count": sum(1 for e in expenses if e.get("status") == "pending"),
            "approved_count": sum(1 for e in expenses if e.get("status") == "approved"),
            "pending_total": pending_total,
            "approved_total": approved_total
        }
    }

@router.post("/expenses")
async def create_expense(
    data: ExpenseCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new expense entry in the ledger"""
    expense = {
        "id": str(uuid.uuid4()),
        "company_id": current_user.id,
        "vendor_name": data.vendor_name,
        "expense_date": data.expense_date,
        "amount": data.amount,
        "category": data.category if data.category in EXPENSE_CATEGORIES else "other",
        "receipt_number": data.receipt_number,
        "description": data.description,
        "payment_method": data.payment_method,
        "load_reference": data.load_reference,
        "driver_id": data.driver_id,
        "driver_name": data.driver_name,
        "vehicle_id": data.vehicle_id,
        "vehicle_name": data.vehicle_name,
        "line_items": data.line_items or [],
        "receipt_image_url": data.receipt_image_url,
        "status": "pending",  # Always starts as pending
        "created_by": current_user.id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.expenses.insert_one(expense)
    expense.pop("_id", None)
    
    return {"message": "Expense created successfully", "expense": expense}

@router.get("/expenses/{expense_id}")
async def get_expense(
    expense_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a single expense by ID"""
    expense = await db.expenses.find_one(
        {"id": expense_id, "company_id": current_user.id},
        {"_id": 0}
    )
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    return expense

@router.put("/expenses/{expense_id}")
async def update_expense(
    expense_id: str,
    data: ExpenseUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update an expense entry (only if still pending)"""
    expense = await db.expenses.find_one({
        "id": expense_id,
        "company_id": current_user.id
    })
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    if expense.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Can only edit pending expenses")
    
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.expenses.update_one(
        {"id": expense_id, "company_id": current_user.id},
        {"$set": update_data}
    )
    
    updated_expense = await db.expenses.find_one(
        {"id": expense_id},
        {"_id": 0}
    )
    
    return {"message": "Expense updated successfully", "expense": updated_expense}

@router.post("/expenses/{expense_id}/approve")
async def approve_expense(
    expense_id: str,
    current_user: User = Depends(get_current_user)
):
    """Approve an expense and create corresponding AP entry"""
    expense = await db.expenses.find_one({
        "id": expense_id,
        "company_id": current_user.id
    })
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    if expense.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Expense is not pending approval")
    
    # Generate bill number for AP
    bill_number = f"EXP-{expense.get('receipt_number', str(uuid.uuid4())[:8].upper())}"
    
    # Check if AP already exists
    existing_ap = await db.accounts_payable.find_one({
        "expense_id": expense_id,
        "company_id": current_user.id
    })
    
    if existing_ap:
        raise HTTPException(status_code=400, detail="AP entry already exists for this expense")
    
    # Create AP entry from approved expense
    ap_entry = {
        "id": str(uuid.uuid4()),
        "company_id": current_user.id,
        "vendor_name": expense.get("vendor_name"),
        "vendor_email": "",
        "bill_number": bill_number,
        "amount": expense.get("amount"),
        "amount_paid": 0,
        "due_date": expense.get("expense_date"),  # Due immediately for expenses
        "description": expense.get("description") or f"{expense.get('category', 'Expense').replace('_', ' ').title()} - {expense.get('vendor_name')}",
        "category": expense.get("category"),
        "load_reference": expense.get("load_reference"),
        "driver_id": expense.get("driver_id"),
        "driver_name": expense.get("driver_name"),
        "vehicle_id": expense.get("vehicle_id"),
        "vehicle_name": expense.get("vehicle_name"),
        "expense_id": expense_id,  # Link back to expense
        "status": "pending",
        "created_by": current_user.id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "auto_generated": True,
        "source": "expense_approval"
    }
    
    await db.accounts_payable.insert_one(ap_entry)
    
    # Update expense status
    await db.expenses.update_one(
        {"id": expense_id, "company_id": current_user.id},
        {
            "$set": {
                "status": "approved",
                "approved_by": current_user.id,
                "approved_at": datetime.now(timezone.utc).isoformat(),
                "ap_id": ap_entry["id"],
                "ap_bill_number": bill_number
            }
        }
    )
    
    return {
        "message": "Expense approved and AP entry created",
        "expense_id": expense_id,
        "ap_entry": {
            "id": ap_entry["id"],
            "bill_number": bill_number,
            "amount": ap_entry["amount"]
        }
    }

@router.post("/expenses/{expense_id}/reject")
async def reject_expense(
    expense_id: str,
    reason: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Reject an expense"""
    expense = await db.expenses.find_one({
        "id": expense_id,
        "company_id": current_user.id
    })
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    if expense.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Expense is not pending")
    
    await db.expenses.update_one(
        {"id": expense_id, "company_id": current_user.id},
        {
            "$set": {
                "status": "rejected",
                "rejected_by": current_user.id,
                "rejected_at": datetime.now(timezone.utc).isoformat(),
                "rejection_reason": reason
            }
        }
    )
    
    return {"message": "Expense rejected", "expense_id": expense_id}

@router.delete("/expenses/{expense_id}")
async def delete_expense(
    expense_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an expense (only if pending)"""
    expense = await db.expenses.find_one({
        "id": expense_id,
        "company_id": current_user.id
    })
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    if expense.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Can only delete pending expenses")
    
    await db.expenses.delete_one({"id": expense_id, "company_id": current_user.id})
    
    return {"message": "Expense deleted", "expense_id": expense_id}

@router.get("/expense-categories")
async def get_expense_categories():
    """Get list of available expense categories"""
    return {
        "categories": [
            {"id": "fuel", "name": "Fuel", "icon": "gas-pump"},
            {"id": "repairs_maintenance", "name": "Repairs & Maintenance", "icon": "wrench"},
            {"id": "tires", "name": "Tires", "icon": "circle"},
            {"id": "parts_supplies", "name": "Parts & Supplies", "icon": "cog"},
            {"id": "tolls", "name": "Tolls", "icon": "road"},
            {"id": "permits_licenses", "name": "Permits & Licenses", "icon": "id-card"},
            {"id": "parking", "name": "Parking", "icon": "parking"},
            {"id": "driver_meals", "name": "Driver Meals/Per Diem", "icon": "utensils"},
            {"id": "lodging", "name": "Lodging", "icon": "bed"},
            {"id": "scale_fees", "name": "Scale/Weigh Station Fees", "icon": "balance-scale"},
            {"id": "lumper_fees", "name": "Lumper Fees", "icon": "dolly"},
            {"id": "detention_fees", "name": "Detention Fees", "icon": "clock"},
            {"id": "insurance", "name": "Insurance", "icon": "shield-alt"},
            {"id": "registration", "name": "Registration", "icon": "file-alt"},
            {"id": "cleaning", "name": "Cleaning", "icon": "broom"},
            {"id": "communication", "name": "Communication", "icon": "phone"},
            {"id": "office_supplies", "name": "Office Supplies", "icon": "paperclip"},
            {"id": "professional_services", "name": "Professional Services", "icon": "briefcase"},
            {"id": "other", "name": "Other", "icon": "ellipsis-h"}
        ]
    }


# ==================== RECEIPT PARSING ====================

@router.post("/parse-receipt")
async def parse_receipt(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Parse receipt image using AI to extract expense data for trucking operations"""
    try:
        # Read the file
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode('utf-8')
        
        # Determine mime type
        content_type = file.content_type or 'image/jpeg'
        
        # Use OpenAI Vision API to parse the receipt
        try:
            from emergentintegrations.llm.chat import chat, LlmModel
            import os
            
            # Set the Emergent LLM key
            emergent_key = os.environ.get('EMERGENT_LLM_KEY', 'sk-emergent-73b04E1E4779758EfC')
            
            prompt = """Analyze this receipt/invoice image for a trucking/transport company expense.
            Extract the following information in JSON format:
            {
                "vendor_name": "Name of the vendor/business on the receipt",
                "amount": 0.00,
                "expense_date": "YYYY-MM-DD",
                "receipt_number": "Receipt/Invoice number if visible",
                "description": "Brief description of items/services purchased",
                "category": "one of: fuel, repairs_maintenance, tires, parts_supplies, tolls, permits_licenses, parking, driver_meals, lodging, scale_fees, lumper_fees, detention_fees, insurance, registration, cleaning, communication, office_supplies, professional_services, other",
                "payment_method": "cash/card/check/fleet_card/ach/other",
                "line_items": [
                    {"description": "item name", "quantity": 1, "unit_price": 0.00, "total": 0.00}
                ],
                "gallons": null,
                "price_per_gallon": null,
                "odometer": null,
                "vehicle_number": null,
                "driver_name": null,
                "tax_amount": null,
                "subtotal": null
            }
            
            IMPORTANT CATEGORY DETECTION:
            - Gas stations, diesel, fuel stops → "fuel"
            - Repair shops, mechanics, service centers → "repairs_maintenance"
            - Tire shops, tire service → "tires"
            - Auto parts stores → "parts_supplies"
            - Highway tolls, toll receipts → "tolls"
            - DOT permits, license fees → "permits_licenses"
            - Truck stops parking, lot fees → "parking"
            - Restaurants, fast food, convenience stores (food) → "driver_meals"
            - Hotels, motels → "lodging"
            - CAT scales, weigh stations → "scale_fees"
            
            Return ONLY valid JSON, no other text.
            If a field is not found, use null.
            For amount, extract the TOTAL amount as a number without currency symbols.
            """
            
            response = await chat(
                model=LlmModel.GPT4O,
                system_message="You are an expert at parsing trucking and transportation expense receipts. Extract all relevant financial and operational data accurately.",
                user_message=prompt,
                image_urls=[f"data:{content_type};base64,{base64_image}"],
                api_key=emergent_key
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
            
            # Validate and normalize category
            category = parsed_data.get('category', 'other')
            if category not in EXPENSE_CATEGORIES:
                category = 'other'
            
            return {
                "parsed_data": {
                    "vendor_name": parsed_data.get('vendor_name'),
                    "amount": parsed_data.get('amount'),
                    "expense_date": parsed_data.get('expense_date'),
                    "receipt_number": parsed_data.get('receipt_number'),
                    "description": parsed_data.get('description'),
                    "category": category,
                    "payment_method": parsed_data.get('payment_method'),
                    "line_items": parsed_data.get('line_items'),
                    "gallons": parsed_data.get('gallons'),
                    "price_per_gallon": parsed_data.get('price_per_gallon'),
                    "odometer": parsed_data.get('odometer'),
                    "vehicle_number": parsed_data.get('vehicle_number'),
                    "driver_name": parsed_data.get('driver_name'),
                    "tax_amount": parsed_data.get('tax_amount'),
                    "subtotal": parsed_data.get('subtotal')
                },
                "suggested_category": category,
                "message": "Receipt parsed successfully. Review the data and submit to create expense entry."
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


# ==================== NOTIFICATIONS & ALERTS ====================

class NotificationAlert(BaseModel):
    id: str
    type: str  # 'overdue_ar', 'upcoming_ap', 'payment_due', 'collection_reminder'
    priority: str  # 'high', 'medium', 'low'
    title: str
    message: str
    amount: float
    due_date: str
    days_overdue: int = 0
    related_id: str
    related_type: str  # 'ar' or 'ap'
    created_at: str

@router.get("/alerts")
async def get_accounting_alerts(
    current_user: User = Depends(get_current_user)
):
    """Get notifications and alerts for overdue invoices and upcoming payments"""
    company_id = current_user.id
    today = datetime.now(timezone.utc)
    alerts = []
    
    def parse_due_date(date_val):
        """Parse due date from various formats"""
        if date_val is None:
            return None
        if isinstance(date_val, datetime):
            return date_val.replace(tzinfo=timezone.utc) if date_val.tzinfo is None else date_val
        if isinstance(date_val, str):
            # Try simple date format first YYYY-MM-DD
            try:
                return datetime.strptime(date_val[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except:
                pass
            # Try ISO format with timezone
            try:
                dt = datetime.fromisoformat(date_val.replace("Z", "+00:00"))
                return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt
            except:
                pass
        return None
    
    # 1. Overdue AR (invoices past due date)
    overdue_ar = await db.accounts_receivable.find({
        "company_id": company_id,
        "status": {"$nin": ["paid", "cancelled"]}
    }, {"_id": 0}).to_list(1000)
    
    for ar in overdue_ar:
        try:
            due_date = parse_due_date(ar.get("due_date"))
            if not due_date:
                continue
            
            days_overdue = (today - due_date).days
            
            if days_overdue > 0:
                priority = "high" if days_overdue > 30 else ("medium" if days_overdue > 14 else "low")
                alerts.append(NotificationAlert(
                    id=str(uuid.uuid4()),
                    type="overdue_ar",
                    priority=priority,
                    title=f"Overdue Invoice: {ar.get('invoice_number')}",
                    message=f"Invoice from {ar.get('customer_name')} is {days_overdue} days overdue. Outstanding: ${(ar.get('amount', 0) - ar.get('amount_paid', 0)):,.2f}",
                    amount=ar.get('amount', 0) - ar.get('amount_paid', 0),
                    due_date=ar.get('due_date'),
                    days_overdue=days_overdue,
                    related_id=ar.get('id'),
                    related_type="ar",
                    created_at=today.isoformat()
                ))
        except Exception as e:
            continue
    
    # 2. Upcoming AP (bills due within 7 days)
    upcoming_ap = await db.accounts_payable.find({
        "company_id": company_id,
        "status": {"$nin": ["paid", "cancelled"]}
    }, {"_id": 0}).to_list(1000)
    
    for ap in upcoming_ap:
        try:
            due_date = parse_due_date(ap.get("due_date"))
            if not due_date:
                continue
            
            days_until = (due_date - today).days
            
            if days_until <= 7 and days_until >= 0:
                priority = "high" if days_until <= 2 else ("medium" if days_until <= 5 else "low")
                alerts.append(NotificationAlert(
                    id=str(uuid.uuid4()),
                    type="upcoming_ap",
                    priority=priority,
                    title=f"Payment Due Soon: {ap.get('bill_number')}",
                    message=f"Payment to {ap.get('vendor_name')} is due in {days_until} days. Amount: ${(ap.get('amount', 0) - ap.get('amount_paid', 0)):,.2f}",
                    amount=ap.get('amount', 0) - ap.get('amount_paid', 0),
                    due_date=ap.get('due_date'),
                    days_overdue=-days_until,  # Negative means future
                    related_id=ap.get('id'),
                    related_type="ap",
                    created_at=today.isoformat()
                ))
            elif days_until < 0:
                # Overdue AP
                days_overdue = abs(days_until)
                priority = "high"
                alerts.append(NotificationAlert(
                    id=str(uuid.uuid4()),
                    type="overdue_ap",
                    priority=priority,
                    title=f"Overdue Payment: {ap.get('bill_number')}",
                    message=f"Payment to {ap.get('vendor_name')} is {days_overdue} days overdue! Amount: ${(ap.get('amount', 0) - ap.get('amount_paid', 0)):,.2f}",
                    amount=ap.get('amount', 0) - ap.get('amount_paid', 0),
                    due_date=ap.get('due_date'),
                    days_overdue=days_overdue,
                    related_id=ap.get('id'),
                    related_type="ap",
                    created_at=today.isoformat()
                ))
        except Exception as e:
            continue
    
    # 3. Collection reminders (AR with partial payment but not fully paid after 60+ days)
    for ar in overdue_ar:
        try:
            due_date = parse_due_date(ar.get("due_date"))
            if not due_date:
                continue
            
            days_overdue = (today - due_date).days
            amount_paid = ar.get('amount_paid', 0) or 0
            total_amount = ar.get('amount', 0)
            
            if days_overdue > 60 and amount_paid > 0 and amount_paid < total_amount:
                alerts.append(NotificationAlert(
                    id=str(uuid.uuid4()),
                    type="collection_reminder",
                    priority="high",
                    title=f"Collection Follow-up: {ar.get('invoice_number')}",
                    message=f"Partial payment received from {ar.get('customer_name')} but ${(total_amount - amount_paid):,.2f} still outstanding after {days_overdue} days.",
                    amount=total_amount - amount_paid,
                    due_date=ar.get('due_date'),
                    days_overdue=days_overdue,
                    related_id=ar.get('id'),
                    related_type="ar",
                    created_at=today.isoformat()
                ))
        except Exception as e:
            continue
    
    # Sort alerts by priority (high first) and days_overdue
    priority_order = {"high": 0, "medium": 1, "low": 2}
    alerts.sort(key=lambda x: (priority_order.get(x.priority, 3), -x.days_overdue))
    
    # Summary stats
    high_priority = sum(1 for a in alerts if a.priority == "high")
    medium_priority = sum(1 for a in alerts if a.priority == "medium")
    low_priority = sum(1 for a in alerts if a.priority == "low")
    
    total_ar_overdue = sum(a.amount for a in alerts if a.type in ["overdue_ar", "collection_reminder"])
    total_ap_upcoming = sum(a.amount for a in alerts if a.type in ["upcoming_ap", "overdue_ap"])
    
    return {
        "alerts": [a.dict() for a in alerts],
        "summary": {
            "total_alerts": len(alerts),
            "high_priority": high_priority,
            "medium_priority": medium_priority,
            "low_priority": low_priority,
            "total_ar_overdue": total_ar_overdue,
            "total_ap_upcoming": total_ap_upcoming
        }
    }

@router.post("/alerts/{alert_id}/dismiss")
async def dismiss_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user)
):
    """Dismiss an alert (mark as read/acknowledged)"""
    # Store dismissed alerts in the database
    dismissed_alert = {
        "id": str(uuid.uuid4()),
        "alert_id": alert_id,
        "user_id": current_user.id,
        "dismissed_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.dismissed_alerts.insert_one(dismissed_alert)
    
    return {"message": "Alert dismissed", "alert_id": alert_id}
