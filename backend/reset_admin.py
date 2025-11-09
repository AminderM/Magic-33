import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import os
from dotenv import load_dotenv

load_dotenv()

async def reset_admin():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    # Hash the password
    password_hash = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Update admin user
    result = await db.users.update_one(
        {'email': 'aminderpro@gmail.com'},
        {'$set': {'password_hash': password_hash}}
    )
    
    if result.modified_count > 0:
        print('✓ Admin password reset successfully')
    else:
        print('✗ Failed to reset admin password')
    
    client.close()

asyncio.run(reset_admin())
