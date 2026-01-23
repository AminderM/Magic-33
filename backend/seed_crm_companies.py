import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime, timezone
import uuid

load_dotenv()

async def seed_companies():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    companies = [
        {
            "id": str(uuid.uuid4()),
            "company_name": "TechCorp Solutions",
            "industry": "Technology",
            "website": "https://techcorp.com",
            "phone": "(555) 100-1000",
            "email": "info@techcorp.com",
            "address": "123 Innovation Drive",
            "city": "San Francisco",
            "state": "CA",
            "zip_code": "94102",
            "country": "USA",
            "employee_count": 500,
            "annual_revenue": 50000000,
            "company_type": "customer",
            "status": "active",
            "parent_company": None,
            "account_owner": "John Doe",
            "founded_date": "2015-03-15",
            "customer_since": "2023-01-10",
            "linkedin_url": "https://linkedin.com/company/techcorp",
            "twitter_handle": "@techcorp",
            "notes": "Large enterprise customer, very satisfied with TMS Enterprise",
            "tags": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "owner_id": "admin"
        },
        {
            "id": str(uuid.uuid4()),
            "company_name": "Global Logistics Inc",
            "industry": "Logistics & Supply Chain",
            "website": "https://globallogistics.com",
            "phone": "(555) 200-2000",
            "email": "contact@globallogistics.com",
            "address": "456 Transport Avenue",
            "city": "Chicago",
            "state": "IL",
            "zip_code": "60601",
            "country": "USA",
            "employee_count": 1200,
            "annual_revenue": 120000000,
            "company_type": "prospect",
            "status": "active",
            "parent_company": None,
            "account_owner": "Sarah Johnson",
            "founded_date": "2008-06-20",
            "customer_since": None,
            "linkedin_url": "https://linkedin.com/company/globallogistics",
            "twitter_handle": "@globallogistics",
            "notes": "In active negotiations for Fleet Management system",
            "tags": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "owner_id": "admin"
        },
        {
            "id": str(uuid.uuid4()),
            "company_name": "Express Freight",
            "industry": "Freight & Shipping",
            "website": "https://expressfreight.com",
            "phone": "(555) 300-3000",
            "email": "info@expressfreight.com",
            "address": "789 Cargo Street",
            "city": "Dallas",
            "state": "TX",
            "zip_code": "75201",
            "country": "USA",
            "employee_count": 75,
            "annual_revenue": 8000000,
            "company_type": "customer",
            "status": "active",
            "parent_company": None,
            "account_owner": "Michael Chen",
            "founded_date": "2019-09-01",
            "customer_since": "2024-06-15",
            "linkedin_url": None,
            "twitter_handle": None,
            "notes": "SMB customer on TMS Basic plan",
            "tags": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "owner_id": "admin"
        },
        {
            "id": str(uuid.uuid4()),
            "company_name": "National Transport",
            "industry": "Transportation",
            "website": "https://nationaltransport.com",
            "phone": "(555) 400-4000",
            "email": "sales@nationaltransport.com",
            "address": "321 Highway Blvd",
            "city": "Atlanta",
            "state": "GA",
            "zip_code": "30303",
            "country": "USA",
            "employee_count": 850,
            "annual_revenue": 95000000,
            "company_type": "partner",
            "status": "active",
            "parent_company": None,
            "account_owner": "Emily Rodriguez",
            "founded_date": "2005-04-12",
            "customer_since": "2022-11-20",
            "linkedin_url": "https://linkedin.com/company/nationaltransport",
            "twitter_handle": "@nattransport",
            "notes": "Strategic partner, provides referrals",
            "tags": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "owner_id": "admin"
        },
        {
            "id": str(uuid.uuid4()),
            "company_name": "Metro Distribution",
            "industry": "Distribution",
            "website": "https://metrodist.com",
            "phone": "(555) 500-5000",
            "email": "info@metrodist.com",
            "address": "654 Distribution Way",
            "city": "Los Angeles",
            "state": "CA",
            "zip_code": "90001",
            "country": "USA",
            "employee_count": 150,
            "annual_revenue": 18000000,
            "company_type": "prospect",
            "status": "active",
            "parent_company": None,
            "account_owner": "David Williams",
            "founded_date": "2017-02-28",
            "customer_since": None,
            "linkedin_url": "https://linkedin.com/company/metrodist",
            "twitter_handle": None,
            "notes": "Demo scheduled, high interest level",
            "tags": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "owner_id": "admin"
        }
    ]
    
    for company in companies:
        existing = await db.crm_companies.find_one({"company_name": company["company_name"]})
        if not existing:
            await db.crm_companies.insert_one(company)
            print(f'✓ Created company: {company["company_name"]}')
        else:
            print(f'✗ Company already exists: {company["company_name"]}')
    
    client.close()
    print('\n✓ Company data seeding complete!')

asyncio.run(seed_companies())
