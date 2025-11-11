from fastapi import APIRouter, HTTPException, Depends
from models import *
from auth import get_current_user, require_platform_admin
from database import db
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel
import random

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get('/tenants')
async def list_tenants(current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    tenants = await db.companies.find({}).to_list(length=None)
    
    def enrich_tenant(c):
        # Calculate total seats and storage across all subscriptions
        subscriptions = c.get("subscriptions", [])
        total_seats_allocated = sum(sub.get("seats_allocated", 0) for sub in subscriptions)
        total_seats_used = sum(sub.get("seats_used", 0) for sub in subscriptions)
        total_storage_allocated = sum(sub.get("storage_allocated_gb", 0) for sub in subscriptions)
        total_storage_used = sum(sub.get("storage_used_gb", 0) for sub in subscriptions)
        
        # Get product labels for active subscriptions
        active_products = []
        for sub in subscriptions:
            if sub.get("status") == "active":
                plan = next((p for p in PLANS if p["id"] == sub.get("product_id")), None)
                if plan:
                    base_price = plan.get("price", 0)
                    discount = sub.get("discount_percentage", 0)
                    discounted_price = base_price * (1 - discount / 100)
                    
                    active_products.append({
                        "id": sub.get("id"),
                        "product_id": sub.get("product_id"),
                        "label": plan.get("label"),
                        "tier": plan.get("tier"),
                        "status": sub.get("status"),
                        "base_price": base_price,
                        "discount_percentage": discount,
                        "discounted_price": discounted_price,
                        "discount_reason": sub.get("discount_reason")
                    })
        
        return {
            "id": c.get("id"),
            "name": c.get("name"),
            "company_email": c.get("company_email"),
            "phone_number": c.get("phone_number"),
            "plan": c.get("plan", "tms_basic"),  # Legacy field
            "seats": c.get("seats", 5),  # Legacy field
            "subscription_status": c.get("subscription_status", "active"),
            "subscriptions": subscriptions,
            "active_products": active_products,
            "total_seats_allocated": total_seats_allocated,
            "total_seats_used": total_seats_used,
            "total_storage_allocated": total_storage_allocated,
            "total_storage_used": total_storage_used,
            "billing_email": c.get("billing_email"),
            "payment_method": c.get("payment_method"),
            "next_billing_date": c.get("next_billing_date"),
            "feature_flags": c.get("feature_flags", {}),
            "created_at": c.get("created_at"),
        }
    return [enrich_tenant(c) for c in tenants]

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    company_email: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    billing_email: Optional[str] = None
    payment_method: Optional[str] = None
    subscription_status: Optional[str] = None
    plan: Optional[str] = None  # Legacy field
    seats: Optional[int] = None  # Legacy field
    feature_flags: Optional[Dict[str, bool]] = None

@router.put('/tenants/{tenant_id}')
async def update_tenant(tenant_id: str, payload: TenantUpdate, current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    updates = {k: v for k, v in payload.dict(exclude_unset=True).items() if v is not None}
    if not updates:
        return {"updated": False}
    await db.companies.update_one({"id": tenant_id}, {"$set": updates})
    tenant = await db.companies.find_one({"id": tenant_id})
    return tenant

class SubscriptionCreate(BaseModel):
    product_id: str
    seats_allocated: int = 5
    storage_allocated_gb: int = 10
    status: str = "active"
    discount_percentage: float = 0.0
    discount_reason: Optional[str] = None

class SubscriptionUpdate(BaseModel):
    seats_allocated: Optional[int] = None
    storage_allocated_gb: Optional[int] = None
    status: Optional[str] = None
    schedule_change: bool = True  # If True, changes apply at next billing cycle

@router.post('/tenants/{tenant_id}/subscriptions')
async def add_product_subscription(tenant_id: str, payload: SubscriptionCreate, current_user: User = Depends(get_current_user)):
    """Add a new product subscription to a tenant"""
    require_platform_admin(current_user)
    
    # Verify product exists
    product = next((p for p in PLANS if p["id"] == payload.product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Create subscription object
    subscription = {
        "id": str(uuid.uuid4()),
        "product_id": payload.product_id,
        "status": payload.status,
        "seats_allocated": payload.seats_allocated,
        "seats_used": 0,
        "storage_allocated_gb": payload.storage_allocated_gb,
        "storage_used_gb": 0.0,
        "discount_percentage": payload.discount_percentage,
        "discount_reason": payload.discount_reason,
        "start_date": datetime.now(timezone.utc).isoformat(),
        "next_billing_date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
        "end_date": None,
        "pending_changes": None
    }
    
    # Add subscription to tenant
    await db.companies.update_one(
        {"id": tenant_id},
        {"$push": {"subscriptions": subscription}}
    )
    
    tenant = await db.companies.find_one({"id": tenant_id})
    return {"message": "Subscription added successfully", "subscription": subscription, "tenant": tenant}

@router.put('/tenants/{tenant_id}/subscriptions/{subscription_id}')
async def update_product_subscription(
    tenant_id: str, 
    subscription_id: str, 
    payload: SubscriptionUpdate, 
    current_user: User = Depends(get_current_user)
):
    """Update or schedule changes to a product subscription"""
    require_platform_admin(current_user)
    
    tenant = await db.companies.find_one({"id": tenant_id})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    subscriptions = tenant.get("subscriptions", [])
    sub_index = next((i for i, s in enumerate(subscriptions) if s.get("id") == subscription_id), None)
    
    if sub_index is None:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    updates = payload.dict(exclude_unset=True, exclude={"schedule_change"})
    
    if payload.schedule_change:
        # Schedule changes for next billing cycle
        subscriptions[sub_index]["pending_changes"] = {
            **updates,
            "scheduled_at": datetime.now(timezone.utc).isoformat()
        }
    else:
        # Apply changes immediately
        subscriptions[sub_index].update(updates)
    
    await db.companies.update_one(
        {"id": tenant_id},
        {"$set": {"subscriptions": subscriptions}}
    )
    
    tenant = await db.companies.find_one({"id": tenant_id})
    return {"message": "Subscription updated successfully", "tenant": tenant}

@router.delete('/tenants/{tenant_id}/subscriptions/{subscription_id}')
async def remove_product_subscription(
    tenant_id: str, 
    subscription_id: str, 
    schedule_removal: bool = True,
    current_user: User = Depends(get_current_user)
):
    """Remove or schedule removal of a product subscription"""
    require_platform_admin(current_user)
    
    tenant = await db.companies.find_one({"id": tenant_id})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    subscriptions = tenant.get("subscriptions", [])
    sub_index = next((i for i, s in enumerate(subscriptions) if s.get("id") == subscription_id), None)
    
    if sub_index is None:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if schedule_removal:
        # Schedule cancellation at end of billing period
        subscriptions[sub_index]["status"] = "pending_cancellation"
        subscriptions[sub_index]["pending_changes"] = {
            "action": "cancel",
            "scheduled_at": datetime.now(timezone.utc).isoformat()
        }
        await db.companies.update_one(
            {"id": tenant_id},
            {"$set": {"subscriptions": subscriptions}}
        )
        message = "Subscription cancellation scheduled for end of billing period"
    else:
        # Remove immediately
        await db.companies.update_one(
            {"id": tenant_id},
            {"$pull": {"subscriptions": {"id": subscription_id}}}
        )
        message = "Subscription removed immediately"
    
    tenant = await db.companies.find_one({"id": tenant_id})
    return {"message": message, "tenant": tenant}

@router.get('/plans')
async def get_plans(current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    return PLANS

@router.get('/analytics')
async def get_sales_analytics(current_user: User = Depends(get_current_user)):
    """Get comprehensive sales analytics"""
    require_platform_admin(current_user)
    
    tenants = await db.companies.find({}).to_list(length=None)
    
    # Calculate total lifetime revenue
    total_lifetime_revenue = 0
    monthly_revenue = {}
    weekly_revenue = {}
    new_customer_revenue = {}
    repeat_customer_data = {}
    customer_revenue = {}
    
    for tenant in tenants:
        tenant_id = tenant.get('id')
        created_at = tenant.get('created_at')
        subscriptions = tenant.get('subscriptions', [])
        
        if not created_at:
            continue
            
        # Parse creation date
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        
        # Calculate tenant's total revenue
        tenant_total_revenue = 0
        
        for sub in subscriptions:
            if sub.get('status') in ['active', 'trial']:
                product = next((p for p in PLANS if p['id'] == sub.get('product_id')), None)
                if product:
                    base_price = product.get('price', 0)
                    discount = sub.get('discount_percentage', 0)
                    final_price = base_price * (1 - discount / 100)
                    
                    tenant_total_revenue += final_price
                    total_lifetime_revenue += final_price
                    
                    # Monthly revenue breakdown
                    month_key = created_at.strftime('%Y-%m')
                    monthly_revenue[month_key] = monthly_revenue.get(month_key, 0) + final_price
                    
                    # Weekly revenue breakdown
                    week_key = created_at.strftime('%Y-W%W')
                    weekly_revenue[week_key] = weekly_revenue.get(week_key, 0) + final_price
                    
                    # Track new customer revenue (first month)
                    current_month = datetime.now(timezone.utc).strftime('%Y-%m')
                    if month_key == current_month:
                        new_customer_revenue[month_key] = new_customer_revenue.get(month_key, 0) + final_price
        
        # Store customer revenue for top 5
        if tenant_total_revenue > 0:
            customer_revenue[tenant_id] = {
                'name': tenant.get('name', 'Unknown'),
                'revenue': tenant_total_revenue,
                'subscriptions': len(subscriptions),
                'status': tenant.get('subscription_status', 'active')
            }
    
    # Calculate repeat customers (customers with multiple billing cycles)
    # For demo purposes, we'll track customers by creation month
    repeat_customers_monthly = {}
    for tenant in tenants:
        created_at = tenant.get('created_at')
        if created_at:
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            month_key = created_at.strftime('%Y-%m')
            repeat_customers_monthly[month_key] = repeat_customers_monthly.get(month_key, 0) + 1
    
    # Sort monthly revenue by date
    sorted_monthly_revenue = sorted(monthly_revenue.items(), key=lambda x: x[0])
    
    # Get top 5 customers
    top_customers = sorted(customer_revenue.values(), key=lambda x: x['revenue'], reverse=True)[:5]
    
    # Calculate month-on-month growth
    mom_data = []
    for i, (month, revenue) in enumerate(sorted_monthly_revenue):
        growth = 0
        if i > 0:
            prev_revenue = sorted_monthly_revenue[i-1][1]
            if prev_revenue > 0:
                growth = ((revenue - prev_revenue) / prev_revenue) * 100
        
        mom_data.append({
            'month': month,
            'revenue': revenue,
            'growth': round(growth, 2)
        })
    
    return {
        'total_lifetime_revenue': round(total_lifetime_revenue, 2),
        'monthly_revenue': mom_data,
        'new_activations': {
            'monthly': [{'month': k, 'revenue': round(v, 2)} for k, v in sorted(new_customer_revenue.items())],
            'weekly': [{'week': k, 'revenue': round(v, 2)} for k, v in sorted(weekly_revenue.items())]
        },
        'repeat_customers': {
            'monthly': [{'month': k, 'count': v} for k, v in sorted(repeat_customers_monthly.items())],
        },
        'top_customers': top_customers,
        'total_customers': len(tenants),
        'active_customers': len([t for t in tenants if t.get('subscription_status') == 'active'])
    }

# Helper function to log CRM activities
async def log_crm_activity(user, action: str, entity_type: str, entity_id: str, entity_name: str, details: dict = None):
    try:
        activity_log = {
            "id": str(uuid.uuid4()),
            "user_id": user.id,
            "user_name": f"{user.first_name} {user.last_name}" if hasattr(user, 'first_name') else user.email,
            "user_email": user.email,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "entity_name": entity_name,
            "details": details,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.crm_activity_logs.insert_one(activity_log)
    except Exception as e:
        print(f"Failed to log activity: {e}")

# CRM Endpoints


class IntegrationCreate(BaseModel):
    provider: str
    name: Optional[str] = None
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    scopes: Optional[List[str]] = None

@router.get('/tenants/{tenant_id}/integrations')
async def list_integrations(tenant_id: str, current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    tenant = await db.companies.find_one({"id": tenant_id})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant.get("integrations", {"eld": []})

@router.post('/tenants/{tenant_id}/integrations')
async def add_integration(tenant_id: str, payload: IntegrationCreate, current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    integ = payload.dict()
    if integ.get("client_secret"):
        integ["client_secret_masked"] = f"****{integ['client_secret'][-4:]}"
        del integ["client_secret"]
    integ["created_at"] = datetime.now(timezone.utc).isoformat()
    integ["created_by"] = current_user.email
    await db.companies.update_one({"id": tenant_id}, {"$push": {"integrations.eld": integ}})
    tenant = await db.companies.find_one({"id": tenant_id})
    return tenant.get("integrations", {"eld": []})

    if current_user.role != UserRole.FLEET_OWNER:
        raise HTTPException(status_code=403, detail="Only fleet owners can view drivers")
    
    drivers = await db.users.find({"fleet_owner_id": current_user.id}).to_list(length=None)
    return [User(**driver) for driver in drivers]

@router.put("/drivers/{driver_id}", response_model=dict)
async def update_driver(driver_id: str, driver_data: UserBase, current_user: User = Depends(get_current_user)):
    # Only fleet owners can update drivers
    if current_user.role != UserRole.FLEET_OWNER:
        raise HTTPException(status_code=403, detail="Only fleet owners can update drivers")
    
    # Find driver
    driver = await db.users.find_one({"id": driver_id, "fleet_owner_id": current_user.id})
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    # Update driver
    update_data = driver_data.dict(exclude_unset=True)
    if update_data:
        await db.users.update_one(
            {"id": driver_id},
            {"$set": update_data}
        )
    
    return {"message": "Driver updated successfully"}

@router.delete("/drivers/{driver_id}")
async def delete_driver(driver_id: str, current_user: User = Depends(get_current_user)):
    # Only fleet owners can delete drivers
    if current_user.role != UserRole.FLEET_OWNER:
        raise HTTPException(status_code=403, detail="Only fleet owners can delete drivers")
    
    result = await db.users.delete_one({"id": driver_id, "fleet_owner_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    return {"message": "Driver deleted successfully"}

# Location Tracking Routes
