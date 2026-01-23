# Fleet Marketplace TMS - Product Requirements Document

## Overview
Fleet Marketplace is a B2B SaaS platform connecting manufacturers, fleet owners, and drivers for equipment rental, fleet management, and real-time tracking.

## Architecture
- **Frontend**: React.js with Tailwind CSS
- **Backend**: FastAPI (Python) with async MongoDB
- **Database**: MongoDB (multi-tenant)
- **AI**: OpenAI GPT-5.2 via Emergent LLM Key

## User Personas
1. **Platform Admin**: Full system access
2. **Fleet Owner**: Manage drivers, equipment, loads
3. **Driver**: Mobile app for load management

---

## Mobile Driver App (Completed Jan 23, 2026)

### Route
`/driver-app` (extractable to `driverapp.mydomain.com` later)

### Screens (Matching Wireframes)
1. **Login Screen** - Email/password auth, red theme
2. **Main Dashboard** - Load cards with Route/Docs buttons
3. **Hamburger Menu** - AI Assistant, My Loads, Profile, Settings, Logout
4. **AI Assistant** - GPT-powered Q&A with suggested questions
5. **Documents Screen** - Take Photo + Browse Files upload
6. **Route/Load Detail** - Status workflow, problem reporting
7. **Profile Screen** - Driver info, location status
8. **Settings Screen** - App preferences

### Features
- [x] Mobile-only enforcement (desktop blocked at 768px+)
- [x] Mandatory location tracking gate
- [x] Driver authentication (JWT)
- [x] Load list with status badges
- [x] AI Assistant (GPT-5.2 via Emergent LLM Key)
- [x] Document upload (camera/file)
- [x] Status workflow (assigned → delivered)
- [x] Location tracking with ping
- [x] Messaging with dispatch

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/driver-mobile/login` | POST | Driver auth |
| `/api/driver-mobile/me` | GET | Driver info |
| `/api/driver-mobile/loads` | GET | Assigned loads |
| `/api/driver-mobile/loads/{id}` | GET | Load detail |
| `/api/driver-mobile/loads/{id}/status` | POST | Update status |
| `/api/driver-mobile/loads/{id}/messages` | GET/POST | Messaging |
| `/api/driver-mobile/loads/{id}/documents` | GET/POST | Documents |
| `/api/driver-mobile/ai/chat` | POST | AI Assistant |
| `/api/driver-mobile/ai/history` | GET | Chat history |
| `/api/driver-mobile/location/ping` | POST | Location tracking |

### Test Results (Jan 23, 2026)
- **Backend**: 16/16 tests passed (100%)
- **AI Chat**: Working with 646-char responses
- **All endpoints verified**

---

## Test Credentials
- **Admin**: aminderpro@gmail.com / Admin123!
- **Driver**: driver@test.com / Driver123!

## Future: AI Agent Upgrade
The AI Assistant is architected to be replaced by an AI Agent that can perform actual tasks (not just Q&A).

## Prioritized Backlog
### P0
- [ ] Stripe billing for SaaS customers

### P1  
- [ ] Push notifications
- [ ] WebSocket real-time messaging
- [ ] Offline mode with sync

### P2
- [ ] ELD integration
- [ ] Document OCR
- [ ] Route optimization
