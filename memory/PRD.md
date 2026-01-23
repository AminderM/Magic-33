# Fleet Marketplace TMS - Product Requirements Document

## Overview
Fleet Marketplace is a B2B SaaS platform connecting manufacturers, fleet owners, and drivers for equipment rental, fleet management, and real-time tracking.

## Architecture
- **Frontend**: React.js with Tailwind CSS, Shadcn UI components
- **Backend**: FastAPI (Python) with async MongoDB
- **Database**: MongoDB (multi-tenant, shared database)
- **Authentication**: JWT-based with role-based access control

## User Personas
1. **Platform Admin**: Full system access, tenant management, subscription management
2. **Fleet Owner**: Manage drivers, equipment, loads, view analytics
3. **Driver**: View assigned loads, update status, upload documents, message dispatch

## Core Features Implemented

### Main TMS Application
- [x] User authentication & registration
- [x] Company profile management
- [x] Driver management
- [x] Equipment management
- [x] Booking/Load management
- [x] Live tracking map
- [x] Admin console with CRM
- [x] Subscription management
- [x] Route Mate integration
- [x] Accounting department
- [x] Sales analytics

### Mobile Driver App (NEW - Jan 23, 2026)
**Route**: `/driver-app`

#### Features
- [x] Mobile-only enforcement (desktop blocked)
- [x] Mandatory location tracking gate
- [x] Driver authentication
- [x] Assigned loads list view
- [x] Load detail with tabs (Details, Chat, Docs, Status)
- [x] Load-scoped messaging with dispatch
- [x] Document upload (BOL, POD, Lumper, Scale Ticket)
- [x] Status workflow with event logging
- [x] Location tracking with configurable frequency
- [x] Profile management

#### Status Workflow
assigned → en_route_pickup → arrived_pickup → loaded → en_route_delivery → arrived_delivery → delivered

#### API Endpoints
- `POST /api/driver-mobile/login` - Driver authentication
- `GET /api/driver-mobile/me` - Get driver info
- `GET /api/driver-mobile/loads` - Get assigned loads
- `GET /api/driver-mobile/loads/{id}` - Get load details
- `POST /api/driver-mobile/loads/{id}/status` - Update status
- `GET/POST /api/driver-mobile/loads/{id}/messages` - Messaging
- `GET/POST /api/driver-mobile/loads/{id}/documents` - Documents
- `POST /api/driver-mobile/location/ping` - Location tracking

### TMS Endpoints for Driver Tracking
- `GET /api/drivers/{id}/location/latest` - Driver's last location
- `GET /api/drivers/{id}/location/history` - Location trail
- `GET /api/drivers/loads/{id}/driver-location/latest` - Load's driver location
- `GET/POST /api/drivers/loads/{id}/messages` - Dispatch messaging

## Test Credentials
- **Admin**: aminderpro@gmail.com / Admin123!
- **Driver**: driver@test.com / Driver123!

## What's Been Implemented
| Date | Feature |
|------|---------|
| Jan 23, 2026 | Merged all branches from AminderM repo |
| Jan 23, 2026 | Fixed login/CORS issues |
| Jan 23, 2026 | Built Mobile Driver App with full TMS sync |

## Prioritized Backlog
### P0 (Critical)
- [ ] Stripe subscription billing for customers

### P1 (High)
- [ ] Push notifications for drivers
- [ ] Real-time WebSocket for instant message delivery
- [ ] Driver app offline mode

### P2 (Medium)
- [ ] ELD integration
- [ ] Document OCR/scanning
- [ ] Route optimization

## Deployment Notes
- Driver app extractable to separate domain (`driverapp.mydomain.com`)
- Current route: `/driver-app` (same deployment)
- For separate domain: Create new Emergent project with driver-app code
