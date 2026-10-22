# CampusBite — Self-Service College Canteen Management & Counter-Collection Platform

> **Modern Full-Stack Architecture:** Python 3.12+ (FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL 16) + React 18+ (Next.js 14 App Router, TypeScript, Native CSS Design System) + Applied AI Operations & Sales Insights Assistant.

---

## 1. Project Overview

**CampusBite** is a digital canteen management and express counter-collection platform built specifically for college campuses and institutional dining halls. During 15-to-30 minute class breaks and lunch rushes, hundreds of students converge simultaneously on billing desks. Traditional manual paper tokens create congestion, billing errors, misplaced order slips, kitchen communication breakdowns, and complete absence of real-time wait status for students.

CampusBite replaces manual billing with:
1. **Self-Service Ordering Web Kiosk & Mobile Web App:** Fast, real-time menu browsing with dietary filters (Veg/Non-Veg), instant cart additions, and digital pickup tokens (`#CB...`).
2. **Interactive Kitchen Display System (KDS):** Real-time order cards with preparation timers, 15-minute urgent alerts, one-click state machine transitions, and synthesized Web Audio API melodic chimes.
3. **Executive Administrator Control Panel:** 6 real-time financial & operational KPIs, 7-day revenue trend analytics, cuisine popularity breakdown, menu items CRUD with image support, user security controls with Last Admin Protection, and 1-click RFC 4180 CSV export.
4. **Applied AI Operations & Sales Insights Assistant:** Admin-only read-only natural language assistant grounded in PostgreSQL transactions and deterministic tools (`get_sales_summary`, `get_top_selling_items`, `get_order_status_counts`, `get_menu_availability_summary`).

---

## 2. Fundamental Operational Model: Counter Collection Only

> [!IMPORTANT]
> **CampusBite is explicitly NOT a home-delivery platform.**  
> There are **no delivery personnel**, **no delivery addresses**, **no delivery charges**, and **no GPS driver tracking**.
> 
> The central operational lifecycle is:
> $$\text{Browse Menu} \longrightarrow \text{Add to Cart} \longrightarrow \text{Checkout} \longrightarrow \text{Kitchen Cooking} \longrightarrow \text{Collect at Counter}$$
> 
> The order number (e.g. `#CB2610210001`) acts as a digital pickup token that students present at the physical canteen counter when the order status reaches **Ready for Collection**.

---

## 3. Non-Negotiable Architectural Invariants

1. **Zero Client Trust Pricing:** Item prices, line totals, and taxes sent by the browser are completely ignored. The server fetches authoritative menu items directly from PostgreSQL at checkout, revalidates stock and active status, and computes subtotal and 5% GST tax server-side.
2. **Immutable Accounting Snapshots:** When an order is placed, `item_name_snapshot` and `unit_price` at that exact second are permanently frozen in `order_items`. Editing a dish price or title later in the admin catalog never alters past financial receipts.
3. **ACID Transactional Integrity:** Order creation (`orders`, `order_items`, `payments`, `order_status_history`) executes inside an atomic database transaction. Any failure triggers a complete rollback.
4. **Live Database Account Verification:** On every authenticated HTTP interaction, the system validates `is_active == 1` against PostgreSQL. Suspending an account immediately terminates that user's session on their next click.
5. **Rigid Order State Machine:** Progression strictly enforces:
   $$\text{Placed} \longrightarrow \text{Accepted} \longrightarrow \text{Preparing} \longrightarrow \text{Ready} \longrightarrow \text{Collected}$$
   Customer cancellation is permitted **only** when an order is in the `placed` status.
6. **Last Administrator Protection:** System prohibits deactivating or deleting the last active administrator account to prevent administrative lockout.
7. **Synthesized Web Audio Chimes:** Kitchen Display alerts are generated dynamically via the browser's Web Audio API oscillator ($E_5$ stepping to $A_5$), requiring zero external `.mp3` assets.
8. **Applied AI Read-Only Grounding:** AI queries are strictly bounded to deterministic, parameterized read-only database tools. The AI assistant can never alter prices, stock, or order states.

---

## 4. Technology Stack

| Layer | Technology | Specification / Role |
|---|---|---|
| **Backend Runtime** | Python 3.12+ | High-performance asynchronous API service |
| **API Framework** | FastAPI | OpenAPI documentation, type validation, dependency injection |
| **Data Layer & ORM** | SQLAlchemy 2.0 + asyncpg | Explicit models, ACID transactions, async connection pool |
| **Database Migrations** | Alembic | Version-controlled database schema migrations |
| **Relational Database** | PostgreSQL 16 | Relational persistence, indexes, foreign keys, cascades |
| **Frontend Framework** | React 18+ / Next.js 14+ | App Router, Server Components & Client Components |
| **Language** | TypeScript 5.5+ | Full end-to-end type safety |
| **Design System** | Native CSS3 | CampusBite 2,144-line custom design system (tokens, animations) |
| **Typography** | Google Fonts | `Inter` (body) & `Outfit` (headings & display tokens) |
| **Icons** | Font Awesome 6.5.1 | UI icons across navbar, badges, controls, and kitchen cards |

---

## 5. Quickstart & Local Setup

### Prerequisites
- Python 3.12+ (or `uv` package manager)
- Node.js 18+ / npm
- PostgreSQL 16 (or Docker)

### Option A: Running Locally with WSL / Linux / macOS

#### 1. Setup Backend
```bash
cd backend
# Create virtual environment and install dependencies
uv venv
source .venv/bin/activate
uv pip install -e ".[dev]"

# Configure environment variables
cp .env.example .env

# Run database migrations and seed catalog
alembic upgrade head
python -m app.db.seed

# Start backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API docs available at: `http://localhost:8000/docs`

#### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
Access the application at: `http://localhost:3000`

---

### Option B: Running with Docker Compose
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

## 6. Default Demo Credentials

| Role | Username | Password | Purpose |
|---|---|---|---|
| **Student / Customer** | `rahul` | `Demo@123` | Menu kiosk browsing, cart, checkout, live order tracking |
| **Kitchen Staff** | `staff` | `Staff@123` | Live Kitchen Display System (KDS), preparation timers, order handover |
| **Administrator** | `admin` | `Admin@123` | Executive dashboard, KPIs, menu CRUD, user security, CSV export, AI Insights |

---

## 7. Automated Testing Suite

The application includes a comprehensive pytest suite covering core APIs and non-negotiable invariants:

```bash
cd backend
.venv/bin/pytest -v
```

Tests verify:
- Order number generation format (`CB` + `YYMMDD` + `####`)
- Tax calculation rounding (5% GST rounded to 2 decimals)
- Quantity boundary enforcement (1 to 20 portions)
- Checkout transaction atomicity and rollback safety
- Immutable snapshots (`item_name_snapshot` and `unit_price`)
- Live session invalidation upon user suspension
- Last Administrator Protection
- Rigid kitchen state machine transitions
- Applied AI deterministic grounding queries

