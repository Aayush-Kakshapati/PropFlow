# PropFlow — Property Management System Frontend

A production-ready Next.js frontend for a Django REST property management backend.

## Tech Stack

- **Next.js 14** — React framework with file-based routing
- **Tailwind CSS** — Utility-first styling with custom design tokens
- **Axios** — HTTP client with JWT interceptors
- **Recharts** — Dashboard analytics charts
- **date-fns** — Date formatting
- **Lucide React** — Icon system

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local: set NEXT_PUBLIC_API_URL to your Django backend URL

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

## Project Structure

```
src/
├── api/                    # API service layer
│   ├── client.js           # Axios instance + JWT interceptors
│   ├── authService.js      # Login / refresh
│   ├── dashboardService.js # Dashboard stats
│   ├── propertyService.js  # Properties CRUD
│   ├── unitService.js      # Units CRUD
│   └── services.js         # Lease, Payment, Maintenance services
│
├── components/
│   ├── ui/index.js         # Reusable UI: Spinner, Modal, Badge, Empty/Error states
│   ├── layout/
│   │   ├── Sidebar.js      # Navigation sidebar
│   │   ├── Topbar.js       # Top header bar
│   │   └── DashboardLayout.js
│   └── ProtectedRoute.js   # Auth guard HOC
│
├── context/
│   └── AuthContext.js      # Global auth state (JWT storage + user)
│
├── pages/
│   ├── _app.js             # App root with AuthProvider
│   ├── index.js            # Redirect to /dashboard or /login
│   ├── login.js            # Login page
│   ├── dashboard.js        # Dashboard with stats + charts
│   ├── properties/
│   │   ├── index.js        # Property list + create
│   │   └── [id]/units.js   # Units per property
│   ├── leases.js           # Lease list + create
│   ├── payments.js         # Payment list + record
│   └── maintenance.js      # Maintenance requests + status updates
│
└── styles/
    └── globals.css         # Design tokens + global styles
```

## Authentication Flow

1. User logs in at `/login` with username + password
2. Backend returns JWT `access` + `refresh` tokens
3. Tokens stored in `localStorage` (access_token, refresh_token, user)
4. Axios interceptor automatically attaches `Authorization: Bearer <token>` to every request
5. On 401 response, tokens are cleared and user is redirected to `/login`

## API Configuration

All API calls route through `src/api/client.js`.

The base URL defaults to `http://localhost:8000` and can be overridden via:
```
NEXT_PUBLIC_API_URL=https://your-backend.com
```

## Pages & Features

| Page | Route | Features |
|------|-------|---------|
| Login | `/login` | JWT auth, error handling |
| Dashboard | `/dashboard` | Stats cards, occupancy chart, lease trend, recent properties |
| Properties | `/properties` | List cards, add property modal |
| Units | `/properties/:id/units` | Units grid, occupancy badges, add unit modal |
| Leases | `/leases` | Full table, create lease modal with date pickers |
| Payments | `/payments` | Payment history table, record payment modal, totals |
| Maintenance | `/maintenance` | Filterable requests table, inline status update buttons |

## Design System

Custom CSS variables in `globals.css`:
- `--brand-500` — Primary blue (#3d5cff)
- `--sidebar-bg` — Dark sidebar (#0f1629)
- `--page-bg` — Light page background (#f5f6fb)
- `--text-primary/secondary/muted` — Text hierarchy

Custom utility classes: `.card`, `.btn`, `.btn-primary`, `.btn-secondary`, `.input`, `.label`, `.badge`, `.data-table`, `.modal-overlay`

## Backend API Compatibility

This frontend is built for these endpoints (do not modify):

```
POST /api/token/              - Login
GET  /api/dashboard/          - Dashboard stats
GET  /api/properties/         - List properties
POST /api/properties/create/  - Create property
GET  /api/properties/:id/units/ - List units
POST /api/properties/units/create/ - Create unit
GET  /api/leases/             - List leases
POST /api/leases/create/      - Create lease
GET  /api/payments/           - List payments
POST /api/payments/create/    - Record payment
GET  /api/maintenance/owner-requests/ - Owner's maintenance list
POST /api/maintenance/create/ - Create request (tenant)
PATCH /api/maintenance/update/:id/ - Update status
```

## Production Build

```bash
npm run build
npm start
```
