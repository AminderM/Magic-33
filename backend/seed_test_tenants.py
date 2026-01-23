import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta
import uuid

load_dotenv()

async def seed_tenants():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    # Create 3 test tenants with different subscription models
    tenants = [
        {
            "id": str(uuid.uuid4()),
            "name": "Acme Trucking Co.",
            "owner_id": "test-owner-1",
            "company_type": "trucking",
            "address": "123 Main St",
            "city": "Los Angeles",
            "state": "CA",
            "zip_code": "90001",
            "country": "USA",
            "company_email": "admin@acmetrucking.com",
            "phone_number": "+1-555-0101",
            "billing_email": "billing@acmetrucking.com",
            "payment_method": "card",
            "subscription_status": "active",
            "created_at": datetime.now(timezone.utc),
            "subscriptions": [
                {
                    "id": str(uuid.uuid4()),
                    "product_id": "tms_enterprise",
                    "status": "active",
                    "seats_allocated": 50,
                    "seats_used": 38,
                    "storage_allocated_gb": 100,
                    "storage_used_gb": 67.3,
                    "start_date": datetime.now(timezone.utc).isoformat(),
                    "next_billing_date": (datetime.now(timezone.utc) + timedelta(days=15)).isoformat(),
                    "end_date": None,
                    "pending_changes": None
                },
                {
                    "id": str(uuid.uuid4()),
                    "product_id": "vehicle_management",
                    "status": "active",
                    "seats_allocated": 10,
                    "seats_used": 8,
                    "storage_allocated_gb": 20,
                    "storage_used_gb": 12.1,
                    "start_date": datetime.now(timezone.utc).isoformat(),
                    "next_billing_date": (datetime.now(timezone.utc) + timedelta(days=15)).isoformat(),
                    "end_date": None,
                    "pending_changes": None
                }
            ],
            "verification_status": "verified",
            "plan": "tms_enterprise",
            "seats": 50,
            "feature_flags": {
                "live_tracking": True,
                "eld_integration": True,
                "ai_rate_confirmation": True,
                "docs_versioning": True,
                "apps_marketplace": True,
                "brand_adaptive_theme": True,
                "export_downloads": True,
                "driver_app": True,
                "fleet_management": True,
                "booking_management": True,
                "driver_management": True
            }
        },
        {
            "id": str(uuid.uuid4()),
            "name": "FastHaul Logistics",
            "owner_id": "test-owner-2",
            "company_type": "trucking",
            "address": "456 Commerce Blvd",
            "city": "Chicago",
            "state": "IL",
            "zip_code": "60601",
            "country": "USA",
            "company_email": "contact@fasthaul.com",
            "phone_number": "+1-555-0202",
            "billing_email": "billing@fasthaul.com",
            "payment_method": "invoice",
            "subscription_status": "active",
            "created_at": datetime.now(timezone.utc),
            "subscriptions": [
                {
                    "id": str(uuid.uuid4()),
                    "product_id": "tms_pro",
                    "status": "active",
                    "seats_allocated": 15,
                    "seats_used": 12,
                    "storage_allocated_gb": 30,
                    "storage_used_gb": 18.5,
                    "start_date": datetime.now(timezone.utc).isoformat(),
                    "next_billing_date": (datetime.now(timezone.utc) + timedelta(days=22)).isoformat(),
                    "end_date": None,
                    "pending_changes": {
                        "seats_allocated": 25,
                        "scheduled_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            ],
            "verification_status": "verified",
            "plan": "tms_pro",
            "seats": 15,
            "feature_flags": {
                "live_tracking": True,
                "eld_integration": True,
                "ai_rate_confirmation": True,
                "docs_versioning": True,
                "apps_marketplace": True,
                "brand_adaptive_theme": True,
                "export_downloads": True,
                "driver_app": True
            }
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Metro Freight Services",
            "owner_id": "test-owner-3",
            "company_type": "trucking",
            "address": "789 Industrial Way",
            "city": "Houston",
            "state": "TX",
            "zip_code": "77001",
            "country": "USA",
            "company_email": "info@metrofreight.com",
            "phone_number": "+1-555-0303",
            "billing_email": "accounting@metrofreight.com",
            "payment_method": "ach",
            "subscription_status": "trial",
            "created_at": datetime.now(timezone.utc),
            "subscriptions": [
                {
                    "id": str(uuid.uuid4()),
                    "product_id": "tms_basic",
                    "status": "trial",
                    "seats_allocated": 5,
                    "seats_used": 3,
                    "storage_allocated_gb": 10,
                    "storage_used_gb": 4.2,
                    "start_date": datetime.now(timezone.utc).isoformat(),
                    "next_billing_date": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
                    "end_date": (datetime.now(timezone.utc) + timedelta(days=14)).isoformat(),
                    "pending_changes": None
                }
            ],
            "verification_status": "pending",
            "plan": "tms_basic",
            "seats": 5,
            "feature_flags": {
                "live_tracking": True,
                "eld_integration": False,
                "ai_rate_confirmation": False,
                "docs_versioning": True,
                "apps_marketplace": False
            }
        }
    ]
    
    # Insert tenants
    for tenant in tenants:
        existing = await db.companies.find_one({"company_email": tenant["company_email"]})
        if not existing:
            await db.companies.insert_one(tenant)
            print(f'✓ Created tenant: {tenant["name"]}')
        else:
            print(f'✗ Tenant already exists: {tenant["name"]}')
    
    client.close()
    print('\n✓ Tenant seeding complete!')

asyncio.run(seed_tenants())
