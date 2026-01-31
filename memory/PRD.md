# Fleet Marketplace TMS - Product Requirements Document

## Overview
Fleet Marketplace is a B2B SaaS platform connecting manufacturers, fleet owners, and drivers for equipment rental, fleet management, and real-time tracking.

## Architecture
- **Frontend**: React.js with Tailwind CSS
- **Backend**: FastAPI (Python) with async MongoDB
- **Database**: MongoDB (multi-tenant)
- **AI**: OpenAI GPT-5.2 via Emergent LLM Key
- **Marketing Website**: Separate React app at `/marketing-frontend`

## User Personas
1. **Platform Admin**: Full system access
2. **Fleet Owner**: Manage drivers, equipment, loads
3. **Driver**: Mobile app for load management

---

## Marketing Website (Completed Jan 24, 2026)

### Brand: Integrated Supply Chain Technologies

### Structure
- **Separate frontend** at `/marketing-frontend` (port 3001)
- **Dark theme** inspired by colabsoftware.com
- **Target audience**: Freight Brokers, Fleet Owners, Independent Dispatchers

### Pages
1. **Homepage** - Hero, stats, "Who it's for" cards, benefits, product preview, CTA
2. **Product** - TMS overview, features grid, audience tabs, integrations, pricing ($299/month)
3. **Use Cases** - Specific examples for brokers, fleet owners, dispatchers with stats
4. **About** - Mission, values, milestones timeline, leadership team
5. **Contact** - Demo request form (connected to backend)

### Admin Console Integration
- **Website CMS** under DEVELOPERS section
- View demo requests/leads with status management
- Stats dashboard (Total, New, Contacted, Converted)
- Update lead status and notes

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/marketing/demo-request` | POST | Submit demo request (public) |
| `/api/marketing/content/{section}` | GET | Get website content (public) |
| `/api/marketing/admin/demo-requests` | GET | List all leads (admin) |
| `/api/marketing/admin/demo-requests/{id}` | PUT | Update lead status (admin) |
| `/api/marketing/admin/stats` | GET | Marketing statistics (admin) |
| `/api/marketing/admin/content` | GET/PUT | Manage website content (admin) |

### Test Results (Jan 24, 2026)
- **Backend**: 15/15 tests passed (100%)
- **Frontend**: All UI tests passed (100%)
- Form submission, lead management, status updates verified

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

## Recent Updates (Jan 31, 2026)

### Google Maps API Configuration ✅
- **Issue**: FreightCalculator showed "Google Maps not configured" message
- **Root Cause**: No company record existed in database to store integrations
- **Fix**: Created company record and configured Google Maps integration with user's API key
- **Result**: Map now displays correctly with route preview, Places autocomplete working
- **API Key**: AIzaSyDsJ-7H-UUKvYSPQd7bzJ4A6JTcCvX-EaE (stored in DB)
- **Location**: Sales/Business Development → FreightCalculator tab

### Marketing Website Enhancements
- **Light/Dark Mode Toggle**: Full theme toggle implemented with localStorage persistence
- **FMCSA Carrier Lookup**: API key integrated, phone number UI fixed with SAFER website link
- **Demo Request Form**: Connected to backend, leads visible in Admin Console CMS

### Bug Fixes
- FMCSA API: Fixed data parsing for null responses and nested structures
- Carrier Lookup UI: Shows "N/A - Check SAFER for details" with link when phone unavailable

### API Connection Plan
- Created `/app/memory/MARKETING_API_PLAN.md` documenting all APIs needed
- Recommended: Implement `/api/marketing/platform-stats` for dynamic homepage stats

---

## Prioritized Backlog
### P0
- [ ] Platform Stats API (`/api/marketing/platform-stats`) for dynamic homepage data
- [ ] Email notification integration for demo requests (SendGrid)
- [ ] Stripe billing for SaaS customers

### P1  
- [ ] Apply TMS theme to remaining driver app screens (AIAssistant, Documents, Profile)
- [ ] Testimonials API for marketing website
- [ ] Pricing API with CMS management
- [ ] Push notifications
- [ ] WebSocket real-time messaging

### P2
- [ ] Blog/News API for marketing website
- [ ] ELD integration
- [ ] Document OCR
- [ ] Route optimization
- [ ] Extract Driver Web App to separate Emergent project
