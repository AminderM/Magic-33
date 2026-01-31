# Marketing Website API Connection Plan

## Overview
This document outlines the APIs needed to connect the marketing website to the backend for dynamic content.

## Current State
The marketing website (`/marketing-frontend`) currently uses **hardcoded data** for:
- Hero section stats (500+ companies, 1M+ loads, 99.9% uptime)
- Dashboard preview stats (47 active loads, 23 in transit, etc.)
- All text content

## Existing APIs Available

### 1. Public APIs (No Auth Required)

| Endpoint | Method | Description | Ready |
|----------|--------|-------------|-------|
| `/api/marketing/demo-request` | POST | Submit demo request form | ✅ |
| `/api/marketing/content/{section}` | GET | Get website content by section | ✅ |

### 2. Admin APIs (Auth Required)

| Endpoint | Method | Description | Ready |
|----------|--------|-------------|-------|
| `/api/marketing/admin/demo-requests` | GET | List all demo requests | ✅ |
| `/api/marketing/admin/demo-requests/{id}` | PUT | Update demo request status | ✅ |
| `/api/marketing/admin/content` | GET | Get all content sections | ✅ |
| `/api/marketing/admin/content/{section}` | PUT | Update content section | ✅ |
| `/api/marketing/admin/stats` | GET | Get marketing stats | ✅ |

---

## NEW APIs NEEDED

### 1. Public Platform Stats API (Priority: HIGH)

**Purpose:** Provide dynamic stats for the marketing homepage

**Endpoint:** `GET /api/marketing/platform-stats`

**Response:**
```json
{
  "companies": 500,
  "loads_managed": 1000000,
  "uptime_percentage": 99.9,
  "support_availability": "24/7"
}
```

**Data Sources:**
- `companies`: Count of active tenants from `tenants` collection
- `loads_managed`: Total loads from `loads` collection
- `uptime_percentage`: Hardcoded or from monitoring service
- `support_availability`: Hardcoded

---

### 2. Public Testimonials API (Priority: MEDIUM)

**Purpose:** Display customer testimonials dynamically

**Endpoint:** `GET /api/marketing/testimonials`

**Response:**
```json
{
  "testimonials": [
    {
      "id": "1",
      "name": "John Smith",
      "role": "Operations Manager",
      "company": "Swift Logistics",
      "quote": "This TMS transformed our operations...",
      "avatar_url": "/api/marketing/testimonial/1/avatar"
    }
  ]
}
```

**Admin Endpoint:** `POST/PUT/DELETE /api/marketing/admin/testimonials`

---

### 3. Public Pricing API (Priority: MEDIUM)

**Purpose:** Display pricing plans dynamically (allows CMS updates)

**Endpoint:** `GET /api/marketing/pricing`

**Response:**
```json
{
  "plans": [
    {
      "id": "starter",
      "name": "Starter",
      "price": 299,
      "period": "month",
      "features": ["Load Tracking", "Basic Reporting", "Email Support"],
      "cta": "Start Free Trial"
    },
    {
      "id": "professional",
      "name": "Professional",
      "price": 599,
      "period": "month",
      "features": ["Everything in Starter", "AI Routing", "Priority Support"],
      "cta": "Contact Sales"
    }
  ]
}
```

---

### 4. Public Blog/News API (Priority: LOW)

**Purpose:** Display latest news or blog posts on homepage

**Endpoint:** `GET /api/marketing/blog?limit=3`

**Response:**
```json
{
  "posts": [
    {
      "id": "1",
      "title": "TMS v2.0 Released",
      "excerpt": "We're excited to announce...",
      "image_url": "/api/marketing/blog/1/image",
      "published_at": "2025-01-30T00:00:00Z",
      "slug": "tms-v2-released"
    }
  ]
}
```

---

## Implementation Priority

### Phase 1 (Recommended Now)
1. **Platform Stats API** - Connect hero section stats to real data
2. Update `HomePage.tsx` to fetch from `/api/marketing/platform-stats`

### Phase 2 (Future)
1. Testimonials API
2. Pricing API with CMS management

### Phase 3 (Backlog)
1. Blog/News API
2. Case studies section

---

## Frontend Integration Example

```tsx
// HomePage.tsx - Fetching dynamic stats
const [stats, setStats] = useState({
  companies: '500+',
  loads_managed: '1M+',
  uptime: '99.9%',
  support: '24/7'
});

useEffect(() => {
  fetch('/api/marketing/platform-stats')
    .then(res => res.json())
    .then(data => {
      setStats({
        companies: `${data.companies}+`,
        loads_managed: data.loads_managed > 1000000 ? `${(data.loads_managed/1000000).toFixed(1)}M+` : `${Math.floor(data.loads_managed/1000)}K+`,
        uptime: `${data.uptime_percentage}%`,
        support: data.support_availability
      });
    });
}, []);
```

---

## Recommendation

**Start with Phase 1:** Create the `/api/marketing/platform-stats` endpoint that aggregates real data from your database. This single API will make the marketing homepage dynamic and reflect actual platform usage.

Would you like me to implement the Platform Stats API now?
