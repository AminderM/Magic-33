import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta
import uuid

load_dotenv()

async def seed_crm():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    # Create sample contacts
    contacts = [
        {
            "id": str(uuid.uuid4()),
            "first_name": "John",
            "last_name": "Smith",
            "email": "john.smith@techcorp.com",
            "phone": "+1-555-0101",
            "company": "TechCorp Solutions",
            "position": "CTO",
            "status": "customer",
            "source": "Website",
            "tags": ["enterprise", "tech"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "owner_id": "admin"
        },
        {
            "id": str(uuid.uuid4()),
            "first_name": "Sarah",
            "last_name": "Johnson",
            "email": "sarah.johnson@logistics.com",
            "phone": "+1-555-0202",
            "company": "Global Logistics Inc",
            "position": "VP Operations",
            "status": "prospect",
            "source": "Referral",
            "tags": ["logistics", "mid-market"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "owner_id": "admin"
        },
        {
            "id": str(uuid.uuid4()),
            "first_name": "Michael",
            "last_name": "Chen",
            "email": "m.chen@freight.com",
            "phone": "+1-555-0303",
            "company": "Express Freight",
            "position": "CEO",
            "status": "lead",
            "source": "Campaign",
            "tags": ["freight", "smb"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "owner_id": "admin"
        },
        {
            "id": str(uuid.uuid4()),
            "first_name": "Emily",
            "last_name": "Rodriguez",
            "email": "emily.r@transport.com",
            "phone": "+1-555-0404",
            "company": "National Transport",
            "position": "Director of Fleet",
            "status": "customer",
            "source": "Trade Show",
            "tags": ["fleet", "enterprise"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "owner_id": "admin"
        }
    ]
    
    # Create sample deals
    deals = [
        {
            "id": str(uuid.uuid4()),
            "name": "TechCorp TMS Implementation",
            "value": 50000,
            "stage": "closed_won",
            "contact_id": contacts[0]["id"],
            "probability": 100,
            "description": "Full TMS enterprise implementation with custom integrations",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "owner_id": "admin"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Global Logistics - Fleet Management",
            "value": 35000,
            "stage": "negotiation",
            "contact_id": contacts[1]["id"],
            "probability": 75,
            "description": "Fleet management system for 150 vehicles",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "owner_id": "admin"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Express Freight - Basic TMS",
            "value": 15000,
            "stage": "proposal",
            "contact_id": contacts[2]["id"],
            "probability": 50,
            "description": "TMS Basic plan for small fleet operations",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "owner_id": "admin"
        }
    ]
    
    # Create sample activities
    activities = [
        {
            "id": str(uuid.uuid4()),
            "type": "call",
            "subject": "Product Demo Follow-up",
            "description": "Discussed implementation timeline and pricing",
            "contact_id": contacts[1]["id"],
            "deal_id": deals[1]["id"],
            "completed": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "owner_id": "admin"
        },
        {
            "id": str(uuid.uuid4()),
            "type": "meeting",
            "subject": "Quarterly Business Review",
            "description": "Review system usage and discuss expansion opportunities",
            "contact_id": contacts[0]["id"],
            "completed": False,
            "due_date": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "owner_id": "admin"
        },
        {
            "id": str(uuid.uuid4()),
            "type": "email",
            "subject": "Proposal Sent",
            "description": "Sent detailed proposal with pricing breakdown",
            "contact_id": contacts[2]["id"],
            "deal_id": deals[2]["id"],
            "completed": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "owner_id": "admin"
        },
        {
            "id": str(uuid.uuid4()),
            "type": "task",
            "subject": "Prepare contract documents",
            "description": "Prepare and send contract for review",
            "contact_id": contacts[1]["id"],
            "completed": False,
            "due_date": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "owner_id": "admin"
        }
    ]
    
    # Insert data
    for contact in contacts:
        existing = await db.crm_contacts.find_one({"email": contact["email"]})
        if not existing:
            await db.crm_contacts.insert_one(contact)
            print(f'✓ Created contact: {contact["first_name"]} {contact["last_name"]}')
    
    for deal in deals:
        existing = await db.crm_deals.find_one({"name": deal["name"]})
        if not existing:
            await db.crm_deals.insert_one(deal)
            print(f'✓ Created deal: {deal["name"]}')
    
    for activity in activities:
        await db.crm_activities.insert_one(activity)
        print(f'✓ Created activity: {activity["subject"]}')
    
    client.close()
    print('\n✓ CRM data seeding complete!')

asyncio.run(seed_crm())
