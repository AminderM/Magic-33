import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def migrate_contacts():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    # Update all contacts to add new fields and update status
    contacts = await db.crm_contacts.find({}).to_list(length=None)
    
    status_map = {
        'lead': 'cold_lead',
        'prospect': 'hot_lead',
        'customer': 'customer',
        'inactive': 'cold_lead'
    }
    
    for contact in contacts:
        updates = {}
        
        # Add new fields if they don't exist
        if 'ext' not in contact:
            updates['ext'] = None
        if 'address' not in contact:
            updates['address'] = None
        if 'city' not in contact:
            updates['city'] = None
        if 'state' not in contact:
            updates['state'] = None
        if 'notes' not in contact:
            updates['notes'] = None
        
        # Update status to new values
        old_status = contact.get('status', 'lead')
        new_status = status_map.get(old_status, 'cold_lead')
        updates['status'] = new_status
        
        if updates:
            await db.crm_contacts.update_one(
                {'id': contact['id']},
                {'$set': updates}
            )
            print(f"✓ Migrated contact: {contact.get('first_name')} {contact.get('last_name')}")
    
    client.close()
    print('\n✓ Contact migration complete!')

asyncio.run(migrate_contacts())
