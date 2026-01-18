# Transportation Management System (TMS) - Product Requirements Document

## Original Problem Statement
Build a comprehensive Transportation Management System (TMS) for managing dispatch operations, accounting, sales, HR, fleet maintenance, and fleet safety departments.

## User Personas
- **Platform Administrators**: Manage tenants, subscriptions, and platform-wide settings
- **Fleet Owners**: Manage their fleet, drivers, equipment, and dispatch operations
- **Drivers**: Access mobile interface for load details, navigation, and status updates
- **Dispatchers**: Manage loads, equipment assignment, and tracking
- **Accountants**: Handle invoicing, payments, AR/AP, and financial reporting
- **Sales Team**: Generate quotes, manage CRM, and track leads

## Core Requirements
1. Multi-tenant platform with subscription management
2. Real-time load tracking and dispatch operations
3. Comprehensive accounting module (AR, AP, Expenses, Receipts)
4. Driver portal with mobile-friendly interface
5. AI-powered features (receipt parsing, chat assistant)
6. Admin console for platform management

## Tech Stack
- **Frontend**: React with Tailwind CSS + Shadcn/UI components
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: OpenAI GPT-4 Vision (via Emergent LLM Key)
- **Maps**: Google Maps Platform

---

## What's Been Implemented (as of January 2026)

### ✅ Completed Features

#### Authentication & Authorization
- JWT-based authentication
- Role-based access control (platform_admin, fleet_owner, driver)
- Email verification flow

#### Admin Console
- Dashboard with tenant overview
- User management
- Subscription management
- Carrier lookup (FMCSA API integration)
- Sales analytics
- CRM module
- Products management
- Integrations view
- Theme toggle (light/dark mode)

#### Dispatch Operations
- **Analytics Dashboard**: Real-time KPIs, load status distribution, monthly trends, dispatch calendar with week numbers
- **Equipment Management**: CRUD operations, availability tracking
- **Load Management**: Create, assign, track loads through lifecycle
- **Driver Management**: Driver profiles, license info, status updates
- **Real-time Tracking**: Live location tracking with map view
- **Driver Portal**: Mobile-friendly interface for drivers

#### Accounting
- **Analytics**: Financial overview and reports
- **Accounts Receivable**: Invoice tracking, payment recording, partial/full payment handling
- **Accounts Payable**: Bill management
- **Receipts**: AI-powered receipt parsing (OCR via GPT-4 Vision)
- **Income Tracking**
- **Expense Management**
- Payment modal for recording AR/AP payments

#### Sales & Business Development
- Freight Calculator with Google Maps integration
- Rate quote generation
- CRM integration

#### UI/UX
- **Black/White/Red Theme**: Strict color palette across all workspaces
- **Light/Dark Mode Toggle**: Available on Dashboard and Admin Console
- Custom moon/sun icon toggle
- Consistent theming across all departments

### 🔄 In Progress / Pending Issues

#### P0 - High Priority
- [ ] "Subscription Manager" button text wrapping in Admin Console sidebar

#### P1 - Medium Priority  
- [ ] `DispatchAnalytics.js` uses computed data from bookings - needs dedicated analytics endpoints
- [ ] AI Receipt Classification - auto-categorize as Expense vs Accounts Payable

#### P2 - Lower Priority
- [ ] User Profile Page ("social media style")

### 🔮 Future/Backlog Tasks
- Data Warehouse Integration
- AI-Powered Conversational Quote Generation
- Advanced tenant/company management
- System settings and configuration
- Audit logs and activity tracking
- Notifications and alerts system

---

## Key API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Dispatch
- `GET/POST /api/bookings/requests` - Load management
- `GET/POST /api/drivers` - Driver management
- `PUT /api/drivers/{id}/status` - Update driver status
- `GET/POST /api/equipment` - Equipment management

### Accounting
- `GET/POST /api/accounting/receivables` - AR management
- `POST /api/accounting/receivables/{id}/record-payment` - Record payment
- `GET/POST /api/accounting/payables` - AP management
- `POST /api/accounting/parse-receipt` - AI receipt parsing
- `GET/POST /api/accounting/expenses` - Expense management

### Admin
- `GET /api/admin/tenants` - Get all tenants
- `GET /api/admin/plans` - Get subscription plans
- `GET /api/admin/users` - Platform user management

---

## Database Schema (MongoDB Collections)

### users
- `_id`, `email`, `password_hash`, `full_name`, `role`, `phone`
- `is_active`, `email_verified`, `registration_status`
- `fleet_owner_id`, `created_at`
- For drivers: `license_number`, `license_expiry`, `license_state`, `cdl_class`, `endorsements`

### bookings
- `_id`, `order_number`, `status`, `created_at`
- `shipper`, `consignee`, `pickup_*`, `delivery_*`
- `confirmed_rate`, `total_cost`

### equipment
- `_id`, `name`, `type`, `status`, `location`
- `hourly_rate`, `daily_rate`

### accounts_receivable / accounts_payable
- `_id`, `customer/vendor`, `invoice_number`, `amount`
- `status`, `due_date`, `payments[]`

### expenses / receipts
- `_id`, `date`, `description`, `amount`, `category`
- `receipt_url`, `parsed_data`

---

## 3rd Party Integrations
- **OpenAI GPT-4 Vision**: AI Receipt Parsing (via Emergent LLM Key)
- **Google Maps Platform**: Route calculations, distance estimation
- **FMCSA QCMobile API**: Carrier lookup (requires user API key)
- **@radix-ui/react-toggle**: Theme toggle component

---

## Test Credentials
- **Email**: aminderpro@gmail.com
- **Password**: Admin123!
- **Role**: platform_admin
