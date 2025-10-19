from fastapi import FastAPI, APIRouter, HTTPException, Depends, File, UploadFile, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from enum import Enum
import secrets
import hashlib
from email_service import send_verification_email, send_company_verification_email, send_booking_confirmation_emails

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-this')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="Fleet Marketplace API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    FLEET_OWNER = "fleet_owner"
    MANUFACTURER = "manufacturer"
    CONSTRUCTION_COMPANY = "construction_company"
    WAREHOUSE = "warehouse"
    DRIVER = "driver"

class CompanyType(str, Enum):
    TRUCKING = "trucking"
    MANUFACTURING = "manufacturing"
    CONSTRUCTION = "construction"
    WAREHOUSE = "warehouse"
    EQUIPMENT_RENTAL = "equipment_rental"

class EquipmentType(str, Enum):
    BOX_TRUCK = "box_truck"
    SPRINTER_VAN = "sprinter_van"
    HVAC_TRUCK = "hvac_truck"
    CRANE = "crane"
    FLATBED_TRUCK = "flatbed_truck"
    DRY_VAN = "dry_van"
    REEFER = "reefer"
    BIG_RIG = "big_rig"
    FORKLIFT = "forklift"
    EXCAVATOR = "excavator"

class RegistrationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"

# Models
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: str
    role: UserRole
    
class UserCreate(UserBase):
    password: str
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True
    registration_status: RegistrationStatus = RegistrationStatus.PENDING
    fleet_owner_id: Optional[str] = None  # For drivers
    email_verified: bool = False
    verification_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    password_hash: Optional[str] = None  # For storing hashed password

class CompanyBase(BaseModel):
    name: str
    company_type: CompanyType
    address: str
    city: str
    state: str
    zip_code: str
    tax_id: Optional[str] = None
    
class CompanyCreate(CompanyBase):
    pass

class Company(CompanyBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    verification_status: RegistrationStatus = RegistrationStatus.PENDING
    verification_documents: List[str] = []

class EquipmentBase(BaseModel):
    name: str
    equipment_type: EquipmentType
    description: str
    specifications: dict
    hourly_rate: float
    daily_rate: float
    location_address: str
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    
class EquipmentCreate(EquipmentBase):
    pass

class Equipment(EquipmentBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: str
    company_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_available: bool = True
    images: List[str] = []
    insurance_documents: List[str] = []
    maintenance_records: List[str] = []
    current_driver_id: Optional[str] = None

class LocationUpdate(BaseModel):
    equipment_id: str
    latitude: float
    longitude: float
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    driver_id: Optional[str] = None

class BookingBase(BaseModel):
    equipment_id: str
    start_date: datetime
    end_date: datetime
    pickup_location: str
    delivery_location: str
    notes: Optional[str] = None
    
class BookingCreate(BookingBase):
    pass

class Booking(BookingBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    requester_id: str
    equipment_owner_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: Literal["pending", "approved", "rejected", "completed", "cancelled"] = "pending"
    total_cost: Optional[float] = None

# Utility Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"email": email})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

# Authentication Routes
@api_router.post("/auth/register", response_model=dict)
async def register_user(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user
    user_dict = user_data.dict()
    user_dict.pop("password")
    user_dict["password_hash"] = hashed_password
    user_obj = User(**user_dict)
    
    # Insert user
    result = await db.users.insert_one(user_obj.dict())
    
    return {"message": "User registered successfully", "user_id": user_obj.id, "status": "pending_company_registration"}

@api_router.post("/auth/login", response_model=dict)
async def login_user(login_data: UserLogin):
    # Find user
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create access token
    access_token = create_access_token(data={"sub": user["email"], "role": user["role"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": User(**user).dict(),
        "registration_status": user["registration_status"]
    }

@api_router.get("/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# Company Routes
@api_router.post("/companies", response_model=dict)
async def create_company(company_data: CompanyCreate, current_user: User = Depends(get_current_user)):
    # Check if user already has a company
    existing_company = await db.companies.find_one({"owner_id": current_user.id})
    if existing_company:
        raise HTTPException(status_code=400, detail="User already has a company registered")
    
    # Create company
    company_dict = company_data.dict()
    company_dict["owner_id"] = current_user.id
    company_obj = Company(**company_dict)
    
    # Insert company
    await db.companies.insert_one(company_obj.dict())
    
    return {"message": "Company registered successfully", "company_id": company_obj.id, "status": "pending_verification"}

@api_router.get("/companies/my", response_model=Company)
async def get_my_company(current_user: User = Depends(get_current_user)):
    company = await db.companies.find_one({"owner_id": current_user.id})
    if not company:
        raise HTTPException(status_code=404, detail="No company found for this user")
    return Company(**company)

# Equipment Routes
@api_router.post("/equipment", response_model=dict)
async def create_equipment(equipment_data: EquipmentCreate, current_user: User = Depends(get_current_user)):
    # Get user's company
    company = await db.companies.find_one({"owner_id": current_user.id})
    if not company:
        raise HTTPException(status_code=400, detail="User must have a company to add equipment")
    
    # Create equipment
    equipment_dict = equipment_data.dict()
    equipment_dict["owner_id"] = current_user.id
    equipment_dict["company_id"] = company["id"]
    equipment_obj = Equipment(**equipment_dict)
    
    # Insert equipment
    await db.equipment.insert_one(equipment_obj.dict())
    
    return {"message": "Equipment added successfully", "equipment_id": equipment_obj.id}

@api_router.get("/equipment", response_model=List[Equipment])
async def get_equipment(skip: int = 0, limit: int = 50, equipment_type: Optional[EquipmentType] = None):
    query = {"is_available": True}
    if equipment_type:
        query["equipment_type"] = equipment_type
    
    equipment_list = await db.equipment.find(query).skip(skip).limit(limit).to_list(length=None)
    return [Equipment(**equipment) for equipment in equipment_list]

@api_router.get("/equipment/my", response_model=List[Equipment])
async def get_my_equipment(current_user: User = Depends(get_current_user)):
    equipment_list = await db.equipment.find({"owner_id": current_user.id}).to_list(length=None)
    return [Equipment(**equipment) for equipment in equipment_list]

@api_router.get("/equipment/{equipment_id}", response_model=Equipment)
async def get_equipment_details(equipment_id: str):
    equipment = await db.equipment.find_one({"id": equipment_id})
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return Equipment(**equipment)

# Driver Management Routes
@api_router.post("/drivers", response_model=dict)
async def create_driver_account(driver_data: UserCreate, current_user: User = Depends(get_current_user)):
    # Only fleet owners can create driver accounts
    if current_user.role != UserRole.FLEET_OWNER:
        raise HTTPException(status_code=403, detail="Only fleet owners can create driver accounts")
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": driver_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create driver account
    hashed_password = hash_password(driver_data.password)
    
    driver_dict = driver_data.dict()
    driver_dict.pop("password")
    driver_dict["password_hash"] = hashed_password
    driver_dict["role"] = UserRole.DRIVER
    driver_dict["fleet_owner_id"] = current_user.id
    driver_dict["registration_status"] = RegistrationStatus.VERIFIED  # Auto-verify drivers
    driver_obj = User(**driver_dict)
    
    await db.users.insert_one(driver_obj.dict())
    
    return {"message": "Driver account created successfully", "driver_id": driver_obj.id}

@api_router.get("/drivers/my", response_model=List[User])
async def get_my_drivers(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.FLEET_OWNER:
        raise HTTPException(status_code=403, detail="Only fleet owners can view drivers")
    
    drivers = await db.users.find({"fleet_owner_id": current_user.id}).to_list(length=None)
    return [User(**driver) for driver in drivers]

# Location Tracking Routes
@api_router.post("/locations", response_model=dict)
async def update_location(location_data: LocationUpdate, current_user: User = Depends(get_current_user)):
    # Verify user has access to this equipment
    equipment = await db.equipment.find_one({"id": location_data.equipment_id})
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    # Check if user is the owner or assigned driver
    if equipment["owner_id"] != current_user.id and equipment.get("current_driver_id") != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Update equipment location
    await db.equipment.update_one(
        {"id": location_data.equipment_id},
        {
            "$set": {
                "location_lat": location_data.latitude,
                "location_lng": location_data.longitude,
                "last_location_update": datetime.now(timezone.utc)
            }
        }
    )
    
    # Store location history
    await db.location_history.insert_one(location_data.dict())
    
    return {"message": "Location updated successfully"}

@api_router.get("/locations/{equipment_id}", response_model=List[LocationUpdate])
async def get_equipment_locations(equipment_id: str, current_user: User = Depends(get_current_user)):
    # Verify access
    equipment = await db.equipment.find_one({"id": equipment_id})
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    if equipment["owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    locations = await db.location_history.find({"equipment_id": equipment_id}).sort("timestamp", -1).limit(100).to_list(length=None)
    return [LocationUpdate(**location) for location in locations]

# Booking Routes
@api_router.post("/bookings", response_model=dict)
async def create_booking(booking_data: BookingCreate, current_user: User = Depends(get_current_user)):
    # Get equipment details
    equipment = await db.equipment.find_one({"id": booking_data.equipment_id})
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    if not equipment["is_available"]:
        raise HTTPException(status_code=400, detail="Equipment is not available")
    
    # Calculate total cost
    duration_days = (booking_data.end_date - booking_data.start_date).days
    if duration_days < 1:
        duration_days = 1  # Minimum 1 day
    total_cost = duration_days * equipment["daily_rate"]
    
    # Create booking
    booking_dict = booking_data.dict()
    booking_dict["requester_id"] = current_user.id
    booking_dict["equipment_owner_id"] = equipment["owner_id"]
    booking_dict["total_cost"] = total_cost
    booking_obj = Booking(**booking_dict)
    
    await db.bookings.insert_one(booking_obj.dict())
    
    return {"message": "Booking request created successfully", "booking_id": booking_obj.id, "total_cost": total_cost}

@api_router.get("/bookings/my", response_model=List[Booking])
async def get_my_bookings(current_user: User = Depends(get_current_user)):
    bookings = await db.bookings.find({"requester_id": current_user.id}).to_list(length=None)
    return [Booking(**booking) for booking in bookings]

@api_router.get("/bookings/requests", response_model=List[Booking])
async def get_booking_requests(current_user: User = Depends(get_current_user)):
    bookings = await db.bookings.find({"equipment_owner_id": current_user.id}).to_list(length=None)
    return [Booking(**booking) for booking in bookings]

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()