from fastapi import FastAPI, APIRouter, HTTPException, Depends, File, UploadFile, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal, Dict
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from enum import Enum
import secrets
import hashlib
import json
import asyncio
from email_service import send_verification_email, send_company_verification_email, send_booking_confirmation_emails
from websocket_manager import ConnectionManager

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

# WebSocket Manager
manager = ConnectionManager()

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
    DISPATCHER = "dispatcher"
    ACCOUNTS_RECEIVABLE = "accounts_receivable"
    ACCOUNTS_PAYABLE = "accounts_payable"
    HR = "hr"
    PLATFORM_ADMIN = "platform_admin"

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
    TRACTOR = "tractor"

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

class DocumentVersion(BaseModel):
    url: str
    filename: str
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    uploaded_by: str
    file_size: int  # in bytes

class CompanyBase(BaseModel):
    name: str
    company_type: CompanyType
    address: str
    city: str
    state: str
    zip_code: str
    country: str = "USA"
    tax_id: Optional[str] = None
    # Transportation credentials
    mc_number: Optional[str] = None  # Motor Carrier Number
    dot_number: Optional[str] = None  # Department of Transportation Number
    nsc_number: Optional[str] = None  # National Safety Code (Canadian)
    # Contact information
    phone_number: Optional[str] = None
    company_email: Optional[str] = None  # Linked with MC# account
    correspondence_email: Optional[str] = None
    website: Optional[str] = None
    # Company branding
    logo_url: Optional[str] = None
    theme: Optional[dict] = None
    # Documents with version history
    company_documents: Optional[Dict[str, List[dict]]] = Field(default_factory=lambda: {
        "mc_authority": [],
        "insurance_certificate": [],
        "w9": []
    })
    
class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    tax_id: Optional[str] = None
    mc_number: Optional[str] = None
    dot_number: Optional[str] = None
    nsc_number: Optional[str] = None
    phone_number: Optional[str] = None
    company_email: Optional[str] = None
    correspondence_email: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    plan: Optional[str] = None  # accepts id or label
    seats: Optional[int] = None
    feature_flags: Optional[Dict[str, bool]] = None
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    subscription_status: Optional[str] = None
    integrations: Optional[Dict[str, list]] = None

    theme: Optional[dict] = None

class ProductSubscription(BaseModel):
    """Individual product subscription within a tenant"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str  # Reference to PLANS
    status: str = "active"  # active, pending, canceled, trial
    seats_allocated: int = 5
    seats_used: int = 0
    storage_allocated_gb: int = 10
    storage_used_gb: float = 0.0
    discount_percentage: float = 0.0  # Percentage discount (0-100)
    discount_reason: Optional[str] = None  # Reason for special pricing
    start_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    next_billing_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    pending_changes: Optional[dict] = None  # Stores scheduled changes for next billing cycle

# CRM Models
class CRMContact(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    ext: Optional[str] = None  # Phone extension
    company: Optional[str] = None
    position: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    status: str = "cold_lead"  # cold_lead, hot_lead, customer
    notes: Optional[str] = None
    source: Optional[str] = None  # referral, website, campaign, etc.
    tags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    owner_id: Optional[str] = None  # User who owns this contact

class CRMDeal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    value: float
    stage: str = "prospecting"  # prospecting, qualification, proposal, negotiation, closed_won, closed_lost
    contact_id: str
    expected_close_date: Optional[datetime] = None
    probability: int = 50  # 0-100
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    owner_id: Optional[str] = None

class CRMActivity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # call, email, meeting, note, task
    subject: str
    description: Optional[str] = None
    contact_id: Optional[str] = None
    deal_id: Optional[str] = None
    due_date: Optional[datetime] = None
    completed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    owner_id: Optional[str] = None

class CRMNote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    contact_id: Optional[str] = None
    deal_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None

class CRMCompany(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_name: str
    industry: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    employee_count: Optional[int] = None
    annual_revenue: Optional[float] = None
    company_type: str = "prospect"  # prospect, customer, partner, vendor
    status: str = "active"  # active, inactive, churned
    parent_company: Optional[str] = None
    account_owner: Optional[str] = None
    primary_contact_id: Optional[str] = None
    founded_date: Optional[str] = None
    customer_since: Optional[str] = None
    linkedin_url: Optional[str] = None
    twitter_handle: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    owner_id: Optional[str] = None

class CRMActivityLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    user_email: str
    action: str  # created, updated, deleted
    entity_type: str  # contact, company, deal
    entity_id: str
    entity_name: str
    details: Optional[dict] = None  # Stores what changed
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Company(CompanyBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Legacy single-plan fields (kept for backward compatibility)
    plan: Optional[str] = "tms_basic"
    seats: Optional[int] = 5
    feature_flags: Dict[str, bool] = Field(default_factory=lambda: {
        "live_tracking": True,
        "eld_integration": False,
        "ai_rate_confirmation": True,
        "docs_versioning": True,
        "apps_marketplace": True,
        "brand_adaptive_theme": True,
        "export_downloads": True,
        "driver_app": False,
    })
    
    # New multi-product subscription model
    subscriptions: List[dict] = Field(default_factory=list)  # List of ProductSubscription dicts
    
    # Billing information
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    subscription_status: Optional[str] = None  # active, past_due, canceled
    billing_email: Optional[str] = None
    payment_method: Optional[str] = None  # card, invoice, etc.
    next_billing_date: Optional[datetime] = None
    
    # System
    integrations: Dict[str, list] = Field(default_factory=lambda: {"eld": []})
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
# Subscription Plans
PLANS = [
    {
        "id": "tms_basic",
        "label": "Transportation Management System",
        "price": 299,
        "default_seats": 5,
        "status": "active",
        "tier": "TMS Basic",
        "subtitle": "Complete Fleet & Logistics Solution",
        "description": "Manage your entire fleet operations with real-time tracking, order management, and comprehensive analytics. Perfect for trucking companies, fleet owners, and logistics providers.",
        "features": [
            "Real-time GPS Tracking",
            "Order & Booking Management",
            "Fleet & Equipment Management",
            "Driver Management",
            "+ 4 more features"
        ],
        "all_features": [
            "Real-time GPS Tracking",
            "Order & Booking Management",
            "Fleet & Equipment Management",
            "Driver Management",
            "Company Profile",
            "User Management",
            "Document Version History",
            "Brand Adaptive Theming"
        ],
        "feature_flags": {
            "live_tracking": True,
            "eld_integration": False,
            "ai_rate_confirmation": False,
            "docs_versioning": True,
            "apps_marketplace": False,
            "brand_adaptive_theme": True,
            "export_downloads": True,
            "driver_app": False,
            "fleet_management": True,
            "booking_management": True,
            "driver_management": True,
        },
    },
    {
        "id": "tms_pro",
        "label": "Transportation Management System",
        "price": 299,
        "default_seats": 15,
        "status": "active",
        "tier": "TMS Pro",
        "subtitle": "Complete Fleet & Logistics Solution",
        "description": "Manage your entire fleet operations with real-time tracking, order management, and comprehensive analytics. Perfect for trucking companies, fleet owners, and logistics providers.",
        "features": [
            "Real-time GPS Tracking",
            "Order & Booking Management",
            "Fleet & Equipment Management",
            "Driver Management",
            "+ 4 more features"
        ],
        "all_features": [
            "Real-time GPS Tracking",
            "Order & Booking Management",
            "Fleet & Equipment Management",
            "Driver Management",
            "Company Profile",
            "User Management",
            "Document Version History",
            "Brand Adaptive Theming"
        ],
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
            "driver_management": True,
        },
    },
    {
        "id": "tms_enterprise",
        "label": "Transportation Management System",
        "price": 299,
        "default_seats": 50,
        "status": "active",
        "tier": "TMS Enterprise",
        "subtitle": "Complete Fleet & Logistics Solution",
        "description": "Manage your entire fleet operations with real-time tracking, order management, and comprehensive analytics. Perfect for trucking companies, fleet owners, and logistics providers.",
        "features": [
            "Real-time GPS Tracking",
            "Order & Booking Management",
            "Fleet & Equipment Management",
            "Driver Management",
            "+ 4 more features"
        ],
        "all_features": [
            "Real-time GPS Tracking",
            "Order & Booking Management",
            "Fleet & Equipment Management",
            "Driver Management",
            "Company Profile",
            "User Management",
            "Document Version History",
            "Brand Adaptive Theming"
        ],
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
            "driver_management": True,
            "user_management": True,
            "advanced_analytics": True,
            "custom_integrations": True,
            "priority_support": True,
        },
    },
    {
        "id": "heavy_tms",
        "label": "Heavy Transportation Management System",
        "price": 399,
        "default_seats": 15,
        "status": "coming_soon",
        "subtitle": "Specialized Heavy Haul Operations",
        "description": "Purpose-built for oversized loads, heavy equipment hauling, and specialized transportation with permit management and route planning.",
        "features": [
            "Oversized Load Management",
            "Permit Tracking & Management",
            "Route Planning for Heavy Loads",
            "Equipment Specifications",
            "+ 2 more features"
        ],
        "all_features": [
            "Oversized Load Management",
            "Permit Tracking & Management",
            "Route Planning for Heavy Loads",
            "Equipment Specifications",
            "Weight Distribution Analysis",
            "Escort Coordination"
        ],
        "feature_flags": {
            "oversized_load_management": True,
            "permit_tracking": True,
            "route_planning": True,
            "equipment_specs": True,
        },
    },
    {
        "id": "broker_management",
        "label": "Broker Management System",
        "price": 349,
        "default_seats": 10,
        "status": "coming_soon",
        "subtitle": "Freight Brokerage Platform",
        "description": "Streamline freight brokerage operations with carrier management, load matching, and automated workflows for brokers and freight forwarders.",
        "features": [
            "Carrier Network Management",
            "Load Board Integration",
            "Automated Load Matching",
            "Rate Management",
            "+ 2 more features"
        ],
        "all_features": [
            "Carrier Network Management",
            "Load Board Integration",
            "Automated Load Matching",
            "Rate Management",
            "Commission Tracking",
            "Broker Analytics"
        ],
        "feature_flags": {
            "carrier_management": True,
            "load_board": True,
            "auto_matching": True,
            "rate_management": True,
        },
    },
    {
        "id": "dispatch_management",
        "label": "Dispatch Management System",
        "price": 279,
        "default_seats": 8,
        "status": "coming_soon",
        "subtitle": "Intelligent Dispatch Operations",
        "description": "Optimize dispatching with real-time load assignment, driver communication, and route optimization for maximum efficiency.",
        "features": [
            "Real-time Dispatch Board",
            "Load Assignment & Optimization",
            "Driver Communication",
            "Route Optimization",
            "+ 2 more features"
        ],
        "all_features": [
            "Real-time Dispatch Board",
            "Load Assignment & Optimization",
            "Driver Communication",
            "Route Optimization",
            "ETA Tracking",
            "Automated Notifications"
        ],
        "feature_flags": {
            "dispatch_board": True,
            "load_assignment": True,
            "driver_comm": True,
            "route_optimization": True,
        },
    },
    {
        "id": "freight_management",
        "label": "Freight Management System",
        "price": 329,
        "default_seats": 12,
        "status": "coming_soon",
        "subtitle": "End-to-End Freight Operations",
        "description": "Complete freight management solution covering shipment tracking, carrier selection, documentation, and freight audit & payment.",
        "features": [
            "Shipment Tracking & Visibility",
            "Multi-Modal Transportation",
            "Carrier Selection & Rating",
            "BOL & Documentation",
            "+ 2 more features"
        ],
        "all_features": [
            "Shipment Tracking & Visibility",
            "Multi-Modal Transportation",
            "Carrier Selection & Rating",
            "BOL & Documentation",
            "Freight Audit & Payment",
            "Claims Management"
        ],
        "feature_flags": {
            "shipment_tracking": True,
            "multi_modal": True,
            "carrier_selection": True,
            "documentation": True,
        },
    },
    {
        "id": "vehicle_management",
        "label": "Vehicle Management System",
        "price": 249,
        "default_seats": 10,
        "status": "coming_soon",
        "subtitle": "Complete Fleet Maintenance & Asset Management",
        "description": "Comprehensive vehicle lifecycle management including maintenance scheduling, inspections, fuel management, and asset tracking.",
        "features": [
            "Preventive Maintenance Scheduling",
            "Vehicle Inspections (DVIR)",
            "Fuel Management & Tracking",
            "Service History & Records",
            "+ 2 more features"
        ],
        "all_features": [
            "Preventive Maintenance Scheduling",
            "Vehicle Inspections (DVIR)",
            "Fuel Management & Tracking",
            "Service History & Records",
            "Asset Depreciation",
            "Warranty Management"
        ],
        "feature_flags": {
            "maintenance_scheduling": True,
            "vehicle_inspections": True,
            "fuel_tracking": True,
            "service_history": True,
        },
    },
    {
        "id": "safety_compliance",
        "label": "Safety and Compliance System",
        "price": 199,
        "default_seats": 5,
        "status": "coming_soon",
        "subtitle": "DOT Compliance & Safety Management",
        "description": "Ensure full regulatory compliance with DOT, FMCSA, and safety regulations. Manage driver qualifications, HOS, drug testing, and safety programs.",
        "features": [
            "DOT/FMCSA Compliance Tracking",
            "Driver Qualification Files (DQF)",
            "Hours of Service (HOS) Management",
            "Drug & Alcohol Testing Programs",
            "+ 2 more features"
        ],
        "all_features": [
            "DOT/FMCSA Compliance Tracking",
            "Driver Qualification Files (DQF)",
            "Hours of Service (HOS) Management",
            "Drug & Alcohol Testing Programs",
            "Safety Score Monitoring",
            "Violation Management"
        ],
        "feature_flags": {
            "dot_compliance": True,
            "dqf_management": True,
            "hos_management": True,
            "drug_testing": True,
        },
    },
]

PLAN_ID_BY_LABEL = {p["label"].lower(): p["id"] for p in PLANS}
PLANS_BY_ID = {p["id"]: p for p in PLANS}

def normalize_plan(plan_value: str) -> str:
    if not plan_value:
        return "tms_basic"
    v = plan_value.strip().lower()
    # accept either id or label
    if v in PLANS_BY_ID:
        return v
    return PLAN_ID_BY_LABEL.get(v, "tms_basic")

# Admin utilities
PLATFORM_ADMIN_EMAILS = {"aminderpro@gmail.com"}

def require_platform_admin(user: 'User'):
    if user.role == UserRole.PLATFORM_ADMIN:
        return
    # Allow by email list for now
    if user.email in PLATFORM_ADMIN_EMAILS:
        return
    raise HTTPException(status_code=403, detail="Platform admin only")

    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    last_location_update: Optional[datetime] = None

class LocationUpdate(BaseModel):
    equipment_id: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    driver_id: Optional[str] = None
    speed: Optional[float] = Field(None, ge=0)
    heading: Optional[float] = Field(None, ge=0, lt=360)
    accuracy: Optional[float] = None
    
class VehicleStatus(BaseModel):
    vehicle_id: str
    status: Literal["active", "idle", "offline", "maintenance"] = "active"
    battery: Optional[int] = Field(None, ge=0, le=100)
    signal_strength: Optional[int] = Field(None, ge=0, le=100)

class BookingBase(BaseModel):
    equipment_id: str
    start_date: datetime
    end_date: datetime
    pickup_location: str
    delivery_location: str
    notes: Optional[str] = None
    # Shipper information
    shipper_name: Optional[str] = None
    shipper_address: Optional[str] = None
    # Pickup details
    pickup_city: Optional[str] = None
    pickup_state: Optional[str] = None
    pickup_country: Optional[str] = "USA"
    # Delivery details
    delivery_city: Optional[str] = None
    delivery_state: Optional[str] = None
    delivery_country: Optional[str] = "USA"
    # Cargo information
    commodity: Optional[str] = None
    weight: Optional[float] = None  # in lbs
    cubes: Optional[float] = None  # cubic feet
    # Vehicle and driver information
    tractor_number: Optional[str] = None
    trailer_number: Optional[str] = None
    driver_name: Optional[str] = None
    driver_id: Optional[str] = None
    # Timing information
    pickup_time_planned: Optional[datetime] = None
    pickup_time_actual: Optional[datetime] = None
    delivery_time_planned: Optional[datetime] = None
    delivery_time_actual: Optional[datetime] = None
    # Rate information
    confirmed_rate: Optional[float] = None
    
class BookingCreate(BookingBase):
    pass

class Booking(BookingBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str = Field(default_factory=lambda: f"ORD-{str(uuid.uuid4())[:8].upper()}")
    requester_id: str
    equipment_owner_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: Literal["pending", "planned", "in_transit_pickup", "at_pickup", "in_transit_delivery", "at_delivery", "delivered", "invoiced", "payment_overdue", "paid"] = "pending"
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
async def register_user(user_data: UserCreate, background_tasks: BackgroundTasks):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate email verification token
    token = secrets.token_urlsafe(32)
    hashed_token = hashlib.sha256(token.encode()).hexdigest()
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user
    user_dict = user_data.dict()
    user_dict.pop("password")
    user_dict["password_hash"] = hashed_password
    user_dict["verification_token"] = hashed_token
    user_dict["token_expires_at"] = datetime.now(timezone.utc) + timedelta(hours=24)
    user_dict["email_verified"] = False
    user_obj = User(**user_dict)
    
    # Insert user
    await db.users.insert_one(user_obj.dict())
    # noinspection PyStatementEffect

    
    # Send verification email
    verification_url = f"https://dispatch-flows.preview.emergentagent.com/verify-email/{token}"
    await send_verification_email(
        background_tasks,
        user_data.email,
        user_data.full_name,
        verification_url
    )
    
    return {
        "message": "User registered successfully! Please check your email to verify your account.", 
        "user_id": user_obj.id, 
        "status": "email_verification_sent"
    }

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

@api_router.get("/verify-email/{token}")
async def verify_email(token: str):
    # Hash the provided token
    hashed_token = hashlib.sha256(token.encode()).hexdigest()
    
    # Find user with matching token
    user = await db.users.find_one({
        "verification_token": hashed_token,
        "email_verified": False,
        "token_expires_at": {"$gt": datetime.now(timezone.utc)}
    })
    
    if not user:
        raise HTTPException(
            status_code=400, 
            detail="Invalid or expired verification token"
        )
    
    # Update user as verified
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "email_verified": True,
                "verified_at": datetime.now(timezone.utc)
            },
            "$unset": {"verification_token": "", "token_expires_at": ""}
        }
    )
    
    return {"message": "Email verified successfully! You can now complete your company registration."}

@api_router.get("/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# Company Routes

# TEMP: Seed/Force-verify endpoint for admin assistance (can be removed later)
@api_router.post("/admin/seed-platform-admin")
async def seed_platform_admin(email: str = "aminderpro@gmail.com", password: str = "Admin@123!"):
    existing = await db.users.find_one({"email": email})
    if existing:
        # ensure platform admin role and update password
        hashed_password = hash_password(password)
        await db.users.update_one({"email": email}, {"$set": {"role": UserRole.PLATFORM_ADMIN, "email_verified": True, "password_hash": hashed_password}})
        return {"status": "updated", "email": email}
    hashed_password = hash_password(password)
    user = User(
        email=email,
        full_name="Platform Admin",
        phone="0000000000",
        role=UserRole.PLATFORM_ADMIN,
        email_verified=True,
        registration_status=RegistrationStatus.VERIFIED,
    ).dict()
    user["password_hash"] = hashed_password
    await db.users.insert_one(user)
    return {"status": "created", "email": email}

@api_router.post("/companies", response_model=dict)
async def create_company(company_data: CompanyCreate, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user)):
    # Check if user's email is verified
    if not current_user.email_verified:
        raise HTTPException(status_code=400, detail="Please verify your email address first")
    
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
    
    # For demo purposes, auto-verify the company and send notification
    await db.companies.update_one(
        {"id": company_obj.id},
        {"$set": {"verification_status": RegistrationStatus.VERIFIED}}
    )
    
    # Send company verification email
    await send_company_verification_email(
        background_tasks,
        current_user.email,
        current_user.full_name,
        company_data.name
    )
    
    return {
        "message": "Company registered and verified successfully! Check your email for confirmation.", 
        "company_id": company_obj.id, 
        "status": "verified"
    }

@api_router.get("/companies/my", response_model=Company)
async def get_my_company(current_user: User = Depends(get_current_user)):
    company = await db.companies.find_one({"owner_id": current_user.id})
    if not company:
        raise HTTPException(status_code=404, detail="No company found for this user")
    return Company(**company)

@api_router.put("/companies/my", response_model=Company)
async def update_my_company(
    company_update: CompanyUpdate,
    current_user: User = Depends(get_current_user)
):
    # Only fleet owners can update company
    if current_user.role != UserRole.FLEET_OWNER:
        raise HTTPException(status_code=403, detail="Only company admins can update company profile")
    
    company = await db.companies.find_one({"owner_id": current_user.id})
    if not company:
        raise HTTPException(status_code=404, detail="No company found for this user")
    
    # Update company with only provided fields
    update_data = company_update.dict(exclude_unset=True)
    
    if update_data:
        await db.companies.update_one(
            {"id": company["id"]},
            {"$set": update_data}
        )
    

@api_router.get("/companies/current", response_model=Company)
async def get_current_company(current_user: User = Depends(get_current_user)):
    """Return the company associated with the current user.
    - For fleet_owner: company where owner_id == current_user.id
    - For driver: company where owner_id == fleet_owner_id
    - For other roles (dispatcher, AR/AP/HR): company by user's company_id
    """
    # Fleet owner
    if current_user.role == UserRole.FLEET_OWNER:
        company = await db.companies.find_one({"owner_id": current_user.id})
        if not company:
            raise HTTPException(status_code=404, detail="No company found for this user")
        return Company(**company)

    # Load full user record to access company_id/fleet_owner_id
    user_record = await db.users.find_one({"id": current_user.id})
    if not user_record:
        raise HTTPException(status_code=404, detail="User not found")

    company = None
    # Drivers are linked via fleet_owner_id
    if user_record.get("fleet_owner_id"):
        company = await db.companies.find_one({"owner_id": user_record["fleet_owner_id"]})
    # Other roles use company_id
    if not company and user_record.get("company_id"):
        company = await db.companies.find_one({"id": user_record["company_id"]})

    if not company:
        raise HTTPException(status_code=404, detail="No company found for this user")

    return Company(**company)

    updated_company = await db.companies.find_one({"id": company["id"]})
    return Company(**updated_company)

@api_router.post("/companies/my/upload-logo")
async def upload_company_logo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Only fleet owners can upload logo
    if current_user.role != UserRole.FLEET_OWNER:
        raise HTTPException(status_code=403, detail="Only company admins can upload logo")
    
    company = await db.companies.find_one({"owner_id": current_user.id})
    if not company:
        raise HTTPException(status_code=404, detail="No company found")
    
    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only image files (JPEG, PNG, WebP) are supported")
    
    import tempfile
    import shutil
    import base64
    
    # Save file temporarily and convert to base64 for storage
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_file_path = temp_file.name
    
    try:
        # Read file and convert to base64
        with open(temp_file_path, 'rb') as f:
            file_data = f.read()
            base64_data = base64.b64encode(file_data).decode('utf-8')
            logo_url = f"data:{file.content_type};base64,{base64_data}"
        
        # Update company with logo URL
        await db.companies.update_one(
            {"id": company["id"]},
            {"$set": {"logo_url": logo_url}}
        )
        
        return {"message": "Logo uploaded successfully", "logo_url": logo_url}
    finally:
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

@api_router.post("/companies/my/upload-document")
async def upload_company_document(
    document_type: Literal["mc_authority", "insurance_certificate", "w9"],
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Only fleet owners can upload documents
    if current_user.role != UserRole.FLEET_OWNER:
        raise HTTPException(status_code=403, detail="Only company admins can upload documents")
    
    company = await db.companies.find_one({"owner_id": current_user.id})
    if not company:
        raise HTTPException(status_code=404, detail="No company found")
    
    # Validate file type
    allowed_types = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only PDF and image files are supported")
    
    import tempfile
    import shutil
    import base64
    
    # Read file content to check size
    file_content = await file.read()
    file_size = len(file_content)
    
    # Check file size limit (10MB = 10 * 1024 * 1024 bytes)
    MAX_FILE_SIZE = 10 * 1024 * 1024
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File size exceeds 10MB limit. Current size: {file_size / (1024 * 1024):.2f}MB")
    
    # Reset file pointer for reading
    await file.seek(0)
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_file_path = temp_file.name
    
    try:
        with open(temp_file_path, 'rb') as f:
            file_data = f.read()
            base64_data = base64.b64encode(file_data).decode('utf-8')
            doc_url = f"data:{file.content_type};base64,{base64_data}"
        
        # Create document version entry
        document_version = {
            "url": doc_url,
            "filename": file.filename,
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "uploaded_by": current_user.id,
            "file_size": file_size
        }
        
        # Get current company documents or initialize
        company_docs = company.get("company_documents", {
            "mc_authority": [],
            "insurance_certificate": [],
            "w9": []
        })
        
        # Add new version to document history
        if document_type not in company_docs:
            company_docs[document_type] = []
        
        company_docs[document_type].append(document_version)
        
        # Update company with new document version
        await db.companies.update_one(
            {"id": company["id"]},
            {"$set": {"company_documents": company_docs}}
        )
        
        return {
            "message": f"{document_type.replace('_', ' ').title()} uploaded successfully",
            "version": len(company_docs[document_type]),
            "document": document_version
        }
    finally:
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

# User Management Routes
@api_router.get("/users/company", response_model=List[User])
async def get_company_users(current_user: User = Depends(get_current_user)):
    # Get company
    company = await db.companies.find_one({"owner_id": current_user.id})
    if not company:
        raise HTTPException(status_code=404, detail="No company found")
    
    # Get all users for this company (users who registered with this company)
    users = await db.users.find({"company_id": company["id"]}).to_list(length=None)
    return [User(**user) for user in users]

@api_router.post("/users", response_model=dict)
async def create_user(user_data: UserCreate, current_user: User = Depends(get_current_user)):
    # Only fleet owners can create users
    if current_user.role != UserRole.FLEET_OWNER:
        raise HTTPException(status_code=403, detail="Only company admins can create users")
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Get company
    company = await db.companies.find_one({"owner_id": current_user.id})
    if not company:
        raise HTTPException(status_code=404, detail="No company found")
    
    # Create user account
    hashed_password = hash_password(user_data.password)
    
    user_dict = user_data.dict()
    user_dict.pop("password")
    user_dict["password_hash"] = hashed_password
    user_dict["company_id"] = company["id"]
    user_dict["email_verified"] = True  # Auto-verify company-created users
    user_dict["registration_status"] = RegistrationStatus.VERIFIED
    user_obj = User(**user_dict)
    
    await db.users.insert_one(user_obj.dict())
    
    return {"message": "User created successfully", "user_id": user_obj.id}

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_user)):
    # Only fleet owners can delete users
    if current_user.role != UserRole.FLEET_OWNER:
        raise HTTPException(status_code=403, detail="Only company admins can delete users")
    
    # Cannot delete yourself
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}

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

@api_router.get("/equipment/my/locations", response_model=List[dict])
async def get_my_equipment_locations(current_user: User = Depends(get_current_user)):
    """Get all equipment with their current locations and associated driver/load info for fleet tracking"""
    equipment_list = await db.equipment.find({"owner_id": current_user.id}).to_list(length=None)
    
    result = []
    for equipment in equipment_list:
        vehicle_data = {
            "vehicle_id": equipment["id"],
            "name": equipment["name"],

# admin block moved below

            "asset_number": equipment.get("id", "N/A"),
            "latitude": equipment.get("current_latitude") or equipment.get("location_lat"),
            "longitude": equipment.get("current_longitude") or equipment.get("location_lng"),
            "last_update": equipment.get("last_location_update").isoformat() if equipment.get("last_location_update") else None,
            "status": "active" if equipment.get("is_available") else "idle",
            "driver_id": None,
            "driver_name": None,
            "driver_phone": None,
            "load_number": None
        }
        
        # Get current driver information if assigned
        current_driver_id = equipment.get("current_driver_id")
        if current_driver_id:
            driver = await db.users.find_one({"id": current_driver_id})
            if driver:
                vehicle_data["driver_id"] = driver.get("id", "N/A")
                vehicle_data["driver_name"] = driver.get("full_name", "N/A")
                vehicle_data["driver_phone"] = driver.get("phone", "N/A")
        
        # Get current active load/booking for this equipment
        active_booking = await db.bookings.find_one({
            "equipment_id": equipment["id"],
            "status": {"$in": ["planned", "in_transit_pickup", "at_pickup", "in_transit_delivery", "at_delivery"]}
        })
        
        if active_booking:
            vehicle_data["load_number"] = active_booking.get("order_number", "N/A")
            # If driver info is in booking, use it (override if available)
            if active_booking.get("driver_name"):
                vehicle_data["driver_name"] = active_booking.get("driver_name")
            if active_booking.get("driver_id"):
                vehicle_data["driver_id"] = active_booking.get("driver_id")
        
        result.append(vehicle_data)
    
    return result

@api_router.get("/equipment/{equipment_id}", response_model=Equipment)

# admin block moved below (duplicate removed)

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
# ============= Admin APIs =============
    drivers = await db.users.find({"fleet_owner_id": current_user.id, "role": UserRole.DRIVER}).to_list(length=None)
    return [User(**d) for d in drivers]

@api_router.get('/admin/tenants')
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

@api_router.put('/admin/tenants/{tenant_id}')
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

@api_router.post('/admin/tenants/{tenant_id}/subscriptions')
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

@api_router.put('/admin/tenants/{tenant_id}/subscriptions/{subscription_id}')
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

@api_router.delete('/admin/tenants/{tenant_id}/subscriptions/{subscription_id}')
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

@api_router.get('/admin/plans')
async def get_plans(current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    return PLANS

@api_router.get('/admin/analytics')
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
@api_router.get('/admin/crm/contacts')
async def get_crm_contacts(current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    contacts = await db.crm_contacts.find({}, {"_id": 0}).to_list(length=None)
    return contacts

@api_router.post('/admin/crm/contacts')
async def create_crm_contact(contact: CRMContact, current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    contact.owner_id = current_user.id
    contact_dict = contact.dict()
    contact_dict['created_at'] = contact_dict['created_at'].isoformat()
    contact_dict['updated_at'] = contact_dict['updated_at'].isoformat()
    await db.crm_contacts.insert_one(contact_dict)
    
    # Log activity
    await log_crm_activity(
        current_user, 
        "created", 
        "contact", 
        contact.id, 
        f"{contact.first_name} {contact.last_name}",
        {"company": contact.company, "email": contact.email}
    )
    
    return contact

@api_router.put('/admin/crm/contacts/{contact_id}')
async def update_crm_contact(contact_id: str, contact: CRMContact, current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    contact.updated_at = datetime.now(timezone.utc)
    contact_dict = contact.dict()
    contact_dict['updated_at'] = contact_dict['updated_at'].isoformat()
    if 'created_at' in contact_dict and isinstance(contact_dict['created_at'], datetime):
        contact_dict['created_at'] = contact_dict['created_at'].isoformat()
    await db.crm_contacts.update_one({"id": contact_id}, {"$set": contact_dict})
    
    # Log activity
    await log_crm_activity(
        current_user, 
        "updated", 
        "contact", 
        contact.id, 
        f"{contact.first_name} {contact.last_name}",
        {"status": contact.status, "company": contact.company}
    )
    
    return contact

@api_router.delete('/admin/crm/contacts/{contact_id}')
async def delete_crm_contact(contact_id: str, current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    # Get contact info before deleting
    contact = await db.crm_contacts.find_one({"id": contact_id})
    if contact:
        await log_crm_activity(
            current_user, 
            "deleted", 
            "contact", 
            contact_id, 
            f"{contact.get('first_name', '')} {contact.get('last_name', '')}",
            {"company": contact.get('company'), "email": contact.get('email')}
        )
    await db.crm_contacts.delete_one({"id": contact_id})
    return {"message": "Contact deleted"}

@api_router.post('/admin/crm/contacts/upload')
async def upload_crm_contacts(file: UploadFile, current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    
    # Read CSV file
    import csv
    import io
    
    try:
        contents = await file.read()
        decoded = contents.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(decoded))
        
        contacts_created = 0
        errors = []
        
        for row in csv_reader:
            try:
                contact = {
                    "id": str(uuid.uuid4()),
                    "first_name": row.get('first_name', '').strip(),
                    "last_name": row.get('last_name', '').strip(),
                    "email": row.get('email', '').strip(),
                    "phone": row.get('phone', '').strip() or None,
                    "ext": row.get('ext', '').strip() or None,
                    "company": row.get('company', '').strip() or None,
                    "position": row.get('position', '').strip() or None,
                    "address": row.get('address', '').strip() or None,
                    "city": row.get('city', '').strip() or None,
                    "state": row.get('state', '').strip() or None,
                    "status": row.get('status', 'cold_lead').strip(),
                    "notes": row.get('notes', '').strip() or None,
                    "source": "CSV Import",
                    "tags": [],
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    "owner_id": current_user.id
                }
                
                if not contact['first_name'] or not contact['last_name'] or not contact['email']:
                    errors.append(f"Skipped row with missing required fields: {row}")
                    continue
                
                await db.crm_contacts.insert_one(contact)
                contacts_created += 1
            except Exception as e:
                errors.append(f"Error processing row: {str(e)}")
        
        return {
            "message": f"Successfully imported {contacts_created} contacts",
            "contacts_created": contacts_created,
            "errors": errors
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process CSV: {str(e)}")

@api_router.get('/admin/crm/activity-logs')
async def get_crm_activity_logs(current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    # Get activity logs sorted by most recent first
    logs = await db.crm_activity_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(length=200)
    return logs

@api_router.get('/admin/crm/deals')
async def get_crm_deals(current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    deals = await db.crm_deals.find({}, {"_id": 0}).to_list(length=None)
    return deals

@api_router.post('/admin/crm/deals')
async def create_crm_deal(deal: CRMDeal, current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    deal.owner_id = current_user.id
    deal_dict = deal.dict()
    deal_dict['created_at'] = deal_dict['created_at'].isoformat()
    deal_dict['updated_at'] = deal_dict['updated_at'].isoformat()
    if deal_dict.get('expected_close_date'):
        deal_dict['expected_close_date'] = deal_dict['expected_close_date'].isoformat()
    await db.crm_deals.insert_one(deal_dict)
    
    # Log activity
    await log_crm_activity(
        current_user, 
        "created", 
        "deal", 
        deal.id, 
        deal.name,
        {"value": deal.value, "stage": deal.stage}
    )
    
    return deal

@api_router.put('/admin/crm/deals/{deal_id}')
async def update_crm_deal(deal_id: str, deal: CRMDeal, current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    deal.updated_at = datetime.now(timezone.utc)
    deal_dict = deal.dict()
    deal_dict['updated_at'] = deal_dict['updated_at'].isoformat()
    if 'created_at' in deal_dict and isinstance(deal_dict['created_at'], datetime):
        deal_dict['created_at'] = deal_dict['created_at'].isoformat()
    if deal_dict.get('expected_close_date') and isinstance(deal_dict['expected_close_date'], datetime):
        deal_dict['expected_close_date'] = deal_dict['expected_close_date'].isoformat()
    await db.crm_deals.update_one({"id": deal_id}, {"$set": deal_dict})
    return deal

@api_router.delete('/admin/crm/deals/{deal_id}')
async def delete_crm_deal(deal_id: str, current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    await db.crm_deals.delete_one({"id": deal_id})
    return {"message": "Deal deleted"}

@api_router.get('/admin/crm/activities')
async def get_crm_activities(current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    activities = await db.crm_activities.find({}, {"_id": 0}).to_list(length=None)
    return activities

@api_router.post('/admin/crm/activities')
async def create_crm_activity(activity: CRMActivity, current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    activity.owner_id = current_user.id
    activity_dict = activity.dict()
    activity_dict['created_at'] = activity_dict['created_at'].isoformat()
    if activity_dict.get('due_date'):
        activity_dict['due_date'] = activity_dict['due_date'].isoformat()
    await db.crm_activities.insert_one(activity_dict)
    return activity

@api_router.get('/admin/crm/dashboard')
async def get_crm_dashboard(current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    
    contacts = await db.crm_contacts.find({}).to_list(length=None)
    deals = await db.crm_deals.find({}).to_list(length=None)
    activities = await db.crm_activities.find({}).to_list(length=None)
    
    # Calculate metrics
    total_contacts = len(contacts)
    leads = len([c for c in contacts if c.get('status') == 'lead'])
    customers = len([c for c in contacts if c.get('status') == 'customer'])
    
    total_deal_value = sum(d.get('value', 0) for d in deals)
    won_deals = [d for d in deals if d.get('stage') == 'closed_won']
    total_won_value = sum(d.get('value', 0) for d in won_deals)
    
    deals_by_stage = {}
    for deal in deals:
        stage = deal.get('stage', 'prospecting')
        deals_by_stage[stage] = deals_by_stage.get(stage, 0) + 1
    
    pending_activities = len([a for a in activities if not a.get('completed')])
    
    return {
        'total_contacts': total_contacts,
        'leads': leads,
        'customers': customers,
        'total_deal_value': total_deal_value,
        'total_won_value': total_won_value,
        'won_deals_count': len(won_deals),
        'deals_by_stage': deals_by_stage,
        'pending_activities': pending_activities,
        'conversion_rate': (customers / total_contacts * 100) if total_contacts > 0 else 0
    }

# CRM Company Endpoints
@api_router.get('/admin/crm/companies')
async def get_crm_companies(current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    companies = await db.crm_companies.find({}, {"_id": 0}).to_list(length=None)
    return companies

@api_router.post('/admin/crm/companies')
async def create_crm_company(company: CRMCompany, current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    company.owner_id = current_user.id
    company_dict = company.dict()
    company_dict['created_at'] = company_dict['created_at'].isoformat()
    company_dict['updated_at'] = company_dict['updated_at'].isoformat()
    await db.crm_companies.insert_one(company_dict)
    
    # Log activity
    await log_crm_activity(
        current_user, 
        "created", 
        "company", 
        company.id, 
        company.company_name,
        {"industry": company.industry, "type": company.company_type}
    )
    
    return company

@api_router.put('/admin/crm/companies/{company_id}')
async def update_crm_company(company_id: str, company: CRMCompany, current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    company.updated_at = datetime.now(timezone.utc)
    company_dict = company.dict()
    company_dict['updated_at'] = company_dict['updated_at'].isoformat()
    if 'created_at' in company_dict and isinstance(company_dict['created_at'], datetime):
        company_dict['created_at'] = company_dict['created_at'].isoformat()
    await db.crm_companies.update_one({"id": company_id}, {"$set": company_dict})
    
    # Log activity
    await log_crm_activity(
        current_user, 
        "updated", 
        "company", 
        company.id, 
        company.company_name,
        {"status": company.status, "type": company.company_type}
    )
    
    return company

@api_router.delete('/admin/crm/companies/{company_id}')
async def delete_crm_company(company_id: str, current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    # Get company info before deleting
    company = await db.crm_companies.find_one({"id": company_id})
    if company:
        await log_crm_activity(
            current_user, 
            "deleted", 
            "company", 
            company_id, 
            company.get('company_name', ''),
            {"industry": company.get('industry'), "type": company.get('company_type')}
        )
    await db.crm_companies.delete_one({"id": company_id})
    return {"message": "Company deleted"}

@api_router.post('/admin/crm/companies/upload')
async def upload_crm_companies(file: UploadFile, current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    
    import csv
    import io
    
    try:
        contents = await file.read()
        decoded = contents.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(decoded))
        
        companies_created = 0
        errors = []
        
        for row in csv_reader:
            try:
                company = {
                    "id": str(uuid.uuid4()),
                    "company_name": row.get('company_name', '').strip(),
                    "industry": row.get('industry', '').strip() or None,
                    "website": row.get('website', '').strip() or None,
                    "phone": row.get('phone', '').strip() or None,
                    "email": row.get('email', '').strip() or None,
                    "address": row.get('address', '').strip() or None,
                    "city": row.get('city', '').strip() or None,
                    "state": row.get('state', '').strip() or None,
                    "zip_code": row.get('zip_code', '').strip() or None,
                    "country": row.get('country', '').strip() or None,
                    "employee_count": int(row.get('employee_count', 0)) if row.get('employee_count', '').strip() else None,
                    "annual_revenue": float(row.get('annual_revenue', 0)) if row.get('annual_revenue', '').strip() else None,
                    "company_type": row.get('company_type', 'prospect').strip(),
                    "status": row.get('status', 'active').strip(),
                    "parent_company": row.get('parent_company', '').strip() or None,
                    "account_owner": row.get('account_owner', '').strip() or None,
                    "founded_date": row.get('founded_date', '').strip() or None,
                    "customer_since": row.get('customer_since', '').strip() or None,
                    "linkedin_url": row.get('linkedin_url', '').strip() or None,
                    "twitter_handle": row.get('twitter_handle', '').strip() or None,
                    "notes": row.get('notes', '').strip() or None,
                    "tags": [],
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    "owner_id": current_user.id
                }
                
                if not company['company_name']:
                    errors.append(f"Skipped row with missing company name: {row}")
                    continue
                
                await db.crm_companies.insert_one(company)
                companies_created += 1
            except Exception as e:
                errors.append(f"Error processing row: {str(e)}")
        
        return {
            "message": f"Successfully imported {companies_created} companies",
            "companies_created": companies_created,
            "errors": errors
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process CSV: {str(e)}")

class IntegrationCreate(BaseModel):
    provider: str
    name: Optional[str] = None
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    scopes: Optional[List[str]] = None

@api_router.get('/admin/tenants/{tenant_id}/integrations')
async def list_integrations(tenant_id: str, current_user: User = Depends(get_current_user)):
    require_platform_admin(current_user)
    tenant = await db.companies.find_one({"id": tenant_id})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant.get("integrations", {"eld": []})

@api_router.post('/admin/tenants/{tenant_id}/integrations')
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

@api_router.put("/drivers/{driver_id}", response_model=dict)
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

@api_router.delete("/drivers/{driver_id}")
async def delete_driver(driver_id: str, current_user: User = Depends(get_current_user)):
    # Only fleet owners can delete drivers
    if current_user.role != UserRole.FLEET_OWNER:
        raise HTTPException(status_code=403, detail="Only fleet owners can delete drivers")
    
    result = await db.users.delete_one({"id": driver_id, "fleet_owner_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    return {"message": "Driver deleted successfully"}

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
                "current_latitude": location_data.latitude,
                "current_longitude": location_data.longitude,
                "last_location_update": datetime.now(timezone.utc)
            }
        }
    )
    
    # Store location history
    await db.location_history.insert_one(location_data.dict())
    
    # Broadcast location update to WebSocket clients
    broadcast_data = {
        "vehicle_id": location_data.equipment_id,
        "latitude": location_data.latitude,
        "longitude": location_data.longitude,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await manager.broadcast_location_update(broadcast_data)
    
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
async def create_booking(booking_data: BookingCreate, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user)):
    # Get equipment details
    equipment = await db.equipment.find_one({"id": booking_data.equipment_id})
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    if not equipment["is_available"]:
        raise HTTPException(status_code=400, detail="Equipment is not available")
    
    # Get equipment owner details
    provider = await db.users.find_one({"id": equipment["owner_id"]})
    if not provider:
        raise HTTPException(status_code=404, detail="Equipment owner not found")
    
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
    
    # Send booking confirmation emails
    booking_details = {
        "equipment_name": equipment["name"],
        "start_date": booking_data.start_date.strftime("%B %d, %Y at %I:%M %p"),
        "end_date": booking_data.end_date.strftime("%B %d, %Y at %I:%M %p"),
        "pickup_location": booking_data.pickup_location,
        "delivery_location": booking_data.delivery_location,
        "total_cost": total_cost,
        "booking_id": booking_obj.id[:8] + "...",
        "notes": booking_data.notes or "No special requirements"
    }
    
    await send_booking_confirmation_emails(
        background_tasks,
        current_user.email,
        current_user.full_name,
        provider["email"],
        provider["full_name"],
        booking_details
    )
    
    return {
        "message": "Booking request created successfully! Confirmation emails sent.", 
        "booking_id": booking_obj.id, 
        "total_cost": total_cost
    }

@api_router.get("/bookings/my", response_model=List[Booking])
async def get_my_bookings(current_user: User = Depends(get_current_user)):
    bookings = await db.bookings.find({"requester_id": current_user.id}).to_list(length=None)
    return [Booking(**booking) for booking in bookings]

@api_router.get("/bookings/requests", response_model=List[Booking])
async def get_booking_requests(current_user: User = Depends(get_current_user)):
    bookings = await db.bookings.find({"equipment_owner_id": current_user.id}).to_list(length=None)
    return [Booking(**booking) for booking in bookings]

@api_router.patch("/bookings/{booking_id}/status", response_model=dict)
async def update_booking_status(
    booking_id: str, 
    status: Literal["pending", "planned", "in_transit_pickup", "at_pickup", "in_transit_delivery", "at_delivery", "delivered", "invoiced", "payment_overdue", "paid"],
    current_user: User = Depends(get_current_user)
):
    # Find the booking
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user has permission to update (either requester or equipment owner)
    if booking["requester_id"] != current_user.id and booking["equipment_owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this booking")
    
    # Update the status
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": status}}
    )
    
    return {"message": "Status updated successfully", "status": status}

@api_router.put("/bookings/{booking_id}", response_model=Booking)
async def update_booking(
    booking_id: str,
    booking_update: BookingCreate,
    current_user: User = Depends(get_current_user)
):
    # Find the booking
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user has permission to update
    if booking["requester_id"] != current_user.id and booking["equipment_owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this booking")
    
    # Only allow editing if status is pending
    if booking.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Only bookings with 'pending' status can be edited")
    
    # Update the booking
    update_data = booking_update.dict(exclude_unset=True)
    
    # Convert datetime fields to ISO format strings for MongoDB
    for field in ['pickup_time_planned', 'delivery_time_planned', 'start_date', 'end_date']:
        if field in update_data and update_data[field]:
            if isinstance(update_data[field], datetime):
                update_data[field] = update_data[field].isoformat()
    
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": update_data}
    )
    
    # Get updated booking
    updated_booking = await db.bookings.find_one({"id": booking_id})
    return Booking(**updated_booking)

@api_router.post("/bookings/parse-rate-confirmation", response_model=dict)
async def parse_rate_confirmation(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Parse a rate confirmation document using AI to extract order information
    """
    logger.info(f"Parsing rate confirmation: filename={file.filename}, content_type={file.content_type}")
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType
        import tempfile
        import shutil
        
        # Validate file type
        allowed_types = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        if file.content_type not in allowed_types:
            logger.error(f"Invalid file type: {file.content_type}")
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}. Only PDF and image files (JPEG, PNG) are supported.")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_file_path = temp_file.name
        
        try:
            # Initialize AI chat with Gemini
            api_key = os.environ.get('EMERGENT_LLM_KEY')
            if not api_key:
                raise HTTPException(status_code=500, detail="AI service not configured")
            
            chat = LlmChat(
                api_key=api_key,
                session_id=f"rate-conf-{current_user.id}",
                system_message="You are an AI assistant specialized in extracting structured data from shipping and logistics documents."
            ).with_model("gemini", "gemini-2.0-flash")
            
            # Prepare file for analysis
            file_content = FileContentWithMimeType(
                file_path=temp_file_path,
                mime_type=file.content_type
            )
            
            # Create detailed extraction prompt
            extraction_prompt = """
Analyze this rate confirmation or shipping document and extract the following information. 
Return the data in JSON format with these exact field names:

{
  "shipper_name": "name of the shipper/sender",
  "shipper_address": "full address of shipper",
  "pickup_location": "pickup street address",
  "pickup_city": "pickup city",
  "pickup_state": "pickup state",
  "pickup_country": "pickup country (default USA if not specified)",
  "delivery_location": "delivery street address",
  "delivery_city": "delivery city",
  "delivery_state": "delivery state",
  "delivery_country": "delivery country (default USA if not specified)",
  "commodity": "type of goods being shipped",
  "weight": "weight in pounds (number only)",
  "cubes": "cubic feet (number only)",
  "tractor_number": "tractor number if available",
  "trailer_number": "trailer number if available",
  "driver_name": "driver name if available",
  "driver_id": "driver ID if available",
  "pickup_time_planned": "planned pickup date and time in ISO format (YYYY-MM-DDTHH:MM:SS)",
  "delivery_time_planned": "planned delivery date and time in ISO format (YYYY-MM-DDTHH:MM:SS)",
  "confirmed_rate": "the confirmed rate or total charge amount in dollars (number only, extract from fields like 'Rate', 'Total', 'Charge', 'Amount', or similar)",
  "notes": "any additional notes or special instructions"
}

IMPORTANT: For confirmed_rate, look for monetary values labeled as:
- "Rate"
- "Total Rate"
- "Confirmed Rate" 
- "Total Charge"
- "Amount"
- "Total Amount"
- "Line Haul"
- Any dollar amount that represents the shipping cost

Extract only the numeric value without dollar signs or commas.

If a field is not found in the document, set it to null. 
Return ONLY the JSON object, no additional text or explanation.
"""
            
            # Send message with file
            user_message = UserMessage(
                text=extraction_prompt,
                file_contents=[file_content]
            )
            
            response = await chat.send_message(user_message)
            
            logger.info(f"AI response received, length: {len(response)}")
            
            # Parse the AI response
            response_text = response.strip()
            
            # Try to extract JSON from response
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()
            
            try:
                extracted_data = json.loads(response_text)
                logger.info(f"Successfully extracted data: {list(extracted_data.keys())}")
            except json.JSONDecodeError as e:
                logger.error(f"JSON parse error: {e}, response: {response_text[:500]}")
                raise HTTPException(status_code=500, detail=f"Failed to parse AI response as JSON. AI returned: {response_text[:200]}")
            
            return {
                "success": True,
                "data": extracted_data,
                "message": "Document parsed successfully"
            }
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        logger.error(f"Error parsing rate confirmation: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error parsing document: {str(e)}")

# WebSocket Routes for Real-Time Tracking

@app.websocket("/ws/fleet-tracking")
async def fleet_tracking_websocket(websocket: WebSocket):
    """WebSocket endpoint for fleet managers to receive real-time updates"""
    await manager.connect_fleet(websocket)
    try:
        # Send initial connection confirmation
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "message": "Fleet tracking connected"
        }))
        
        # Keep connection alive and handle any incoming messages
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle different message types from fleet managers
                if message.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
                elif message.get("type") == "request_status":
                    # Send current status of all vehicles with driver and load info
                    vehicles = await db.equipment.find({"is_available": {"$ne": None}}).to_list(length=None)
                    vehicle_statuses = []
                    for vehicle in vehicles:
                        status_info = {
                            "vehicle_id": vehicle["id"],
                            "name": vehicle["name"],
                            "asset_number": vehicle.get("id", "N/A"),
                            "status": "active" if vehicle.get("is_available") else "idle",
                            "latitude": vehicle.get("current_latitude"),
                            "longitude": vehicle.get("current_longitude"),
                            "last_update": vehicle.get("last_location_update").isoformat() if vehicle.get("last_location_update") else None,
                            "driver_id": None,
                            "driver_name": None,
                            "driver_phone": None,
                            "load_number": None
                        }
                        
                        # Get current driver information if assigned
                        current_driver_id = vehicle.get("current_driver_id")
                        if current_driver_id:
                            driver = await db.users.find_one({"id": current_driver_id})
                            if driver:
                                status_info["driver_id"] = driver.get("id", "N/A")
                                status_info["driver_name"] = driver.get("full_name", "N/A")
                                status_info["driver_phone"] = driver.get("phone", "N/A")
                        
                        # Get current active load/booking for this equipment
                        active_booking = await db.bookings.find_one({
                            "equipment_id": vehicle["id"],
                            "status": {"$in": ["planned", "in_transit_pickup", "at_pickup", "in_transit_delivery", "at_delivery"]}
                        })
                        
                        if active_booking:
                            status_info["load_number"] = active_booking.get("order_number", "N/A")
                            # If driver info is in booking, use it (override if available)
                            if active_booking.get("driver_name"):
                                status_info["driver_name"] = active_booking.get("driver_name")
                            if active_booking.get("driver_id"):
                                status_info["driver_id"] = active_booking.get("driver_id")
                        
                        vehicle_statuses.append(status_info)
                    
                    await websocket.send_text(json.dumps({
                        "type": "fleet_status",
                        "payload": vehicle_statuses
                    }))
                    
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"type": "error", "message": "Invalid JSON"}))
            except Exception as e:
                logger.error(f"Error in fleet tracking websocket: {e}")
                
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect_fleet(websocket)

@app.websocket("/ws/vehicle/{vehicle_id}")
async def vehicle_tracking_websocket(websocket: WebSocket, vehicle_id: str):
    """WebSocket endpoint for mobile devices to send location updates"""
    await manager.connect_vehicle(websocket, vehicle_id)
    try:
        # Send initial connection confirmation
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "vehicle_id": vehicle_id,
            "message": f"Vehicle {vehicle_id} tracking connected"
        }))
        
        while True:
            try:
                # Receive location update from mobile device
                data = await websocket.receive_text()
                message = json.loads(data)
                
                if message.get("type") == "location_update":
                    location_data = message.get("payload", {})
                    
                    # Validate location data
                    try:
                        location_update = LocationUpdate(
                            equipment_id=vehicle_id,
                            latitude=location_data["latitude"],
                            longitude=location_data["longitude"],
                            speed=location_data.get("speed"),
                            heading=location_data.get("heading"),
                            accuracy=location_data.get("accuracy")
                        )
                        
                        # Store location in database
                        await db.location_history.insert_one(location_update.dict())
                        
                        # Update equipment current location
                        await db.equipment.update_one(
                            {"id": vehicle_id},
                            {
                                "$set": {
                                    "current_latitude": location_update.latitude,
                                    "current_longitude": location_update.longitude,
                                    "last_location_update": location_update.timestamp
                                }
                            }
                        )
                        
                        # Broadcast to fleet managers
                        broadcast_data = {
                            "vehicle_id": vehicle_id,
                            "latitude": location_update.latitude,
                            "longitude": location_update.longitude,
                            "speed": location_update.speed,
                            "heading": location_update.heading,
                            "timestamp": location_update.timestamp.isoformat()
                        }
                        await manager.broadcast_location_update(broadcast_data)
                        
                        # Send confirmation back to vehicle
                        await websocket.send_text(json.dumps({
                            "type": "location_received",
                            "timestamp": location_update.timestamp.isoformat()
                        }))
                        
                    except Exception as e:
                        logger.error(f"Error processing location update for vehicle {vehicle_id}: {e}")
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": "Invalid location data"
                        }))
                
                elif message.get("type") == "status_update":
                    status_data = message.get("payload", {})
                    
                    try:
                        status_update = VehicleStatus(
                            vehicle_id=vehicle_id,
                            status=status_data.get("status", "active"),
                            battery=status_data.get("battery"),
                            signal_strength=status_data.get("signal_strength")
                        )
                        
                        # Store status update
                        await db.vehicle_status.insert_one({
                            **status_update.dict(),
                            "timestamp": datetime.now(timezone.utc)
                        })
                        
                        # Broadcast to fleet managers
                        await manager.broadcast_status_update(status_update.dict())
                        
                        # Send confirmation
                        await websocket.send_text(json.dumps({
                            "type": "status_received",
                            "timestamp": datetime.now(timezone.utc).isoformat()
                        }))
                        
                    except Exception as e:
                        logger.error(f"Error processing status update for vehicle {vehicle_id}: {e}")
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": "Invalid status data"
                        }))
                
                elif message.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
                    
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"type": "error", "message": "Invalid JSON"}))
            except Exception as e:
                logger.error(f"Error in vehicle websocket {vehicle_id}: {e}")
                
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect_vehicle(websocket, vehicle_id)

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