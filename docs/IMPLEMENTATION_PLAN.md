# US Real Estate Trends Analytics Platform
## Implementation Plan

---

## 1. BUSINESS ANALYSIS

### 1.1 Problem Statement
Real estate investors, homebuyers, and commercial property analysts lack a single, visually compelling dashboard that consolidates pricing trends across US residential and commercial markets. Existing tools are either too expensive (CoStar, Reonomy), too narrow (Zillow focuses on residential only), or lack analytical depth.

### 1.2 Value Proposition
A free-to-use, data-driven analytics platform that visualizes and compares real estate pricing trends across US states, cities, and property types — empowering users to make smarter investment and purchasing decisions.

### 1.3 Target Audience
- **Primary:** Real estate investors & analysts
- **Secondary:** First-time homebuyers researching markets
- **Tertiary:** Commercial real estate developers & brokers

### 1.4 MVP Feature Set
| Feature                     | Description                                                      | Priority |
|-----------------------------|------------------------------------------------------------------|----------|
| Interactive US Heatmap      | Color-coded map showing price changes by state/metro             | P0       |
| Trend Line Charts           | Historical median price charts (residential & commercial)        | P0       |
| Market Summary Cards        | KPI cards: Median Price, YoY Change, Inventory, Days on Market   | P0       |
| Property Type Filter        | Toggle between Residential and Commercial data                   | P0       |
| Region Search & Filter      | Search by State, City, or Zip Code                               | P1       |
| User Authentication         | Sign up/login to save favorite markets                           | P1       |
| Comparison Tool             | Side-by-side comparison of two markets                           | P2       |
| Price Alerts                | Email notifications when a market hits a threshold               | P2       |
| Export Reports (PDF/CSV)    | Download data and charts                                         | P3       |

### 1.5 Data Sources
| Source                      | Type         | Coverage                    | Cost  |
|-----------------------------|--------------|-----------------------------|-------|
| Zillow Research (ZHVI CSV)  | Residential  | State, Metro, City, Zip     | Free  |
| FRED API (Federal Reserve)  | Macro Indices| National, State             | Free  |
| Realtor.com Research        | Residential  | National, Metro             | Free  |
| CBRE / NCREIF (Commercial)  | Commercial   | National, Metro             | Paid  |
| US Census Bureau            | Demographics | National, State, County     | Free  |

### 1.6 Revenue Model (Future)
- **Freemium:** State-level data is free; zip-code level and commercial data requires a subscription ($9.99/mo).
- **Affiliate:** Links to mortgage lenders and real estate platforms.
- **Advertising:** Programmatic ads on the free tier.

---

## 2. SYSTEM ARCHITECTURE

### 2.1 Platform Roles
| Platform   | Role                                                                 |
|------------|----------------------------------------------------------------------|
| **Netlify**    | Hosts the public marketing/landing page (static site, fast CDN)  |
| **Vercel**     | Hosts the Next.js analytics dashboard app (SSR, API routes, Cron)|
| **Supabase**   | PostgreSQL database, Auth, Row Level Security, Realtime           |

### 2.2 Architecture Diagram
```
┌──────────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                                │
│                                                                      │
│   ┌─────────────────────┐         ┌────────────────────────────┐    │
│   │  Landing Page        │  ──▶   │  Analytics Dashboard        │    │
│   │  (Netlify)           │  CTA   │  (Vercel / Next.js)         │    │
│   │  marketing-site.com  │        │  app.marketing-site.com     │    │
│   └─────────────────────┘         └────────────┬───────────────┘    │
└────────────────────────────────────────────────│────────────────────┘
                                                 │
                                  ┌──────────────┴──────────────┐
                                  │  Next.js Server Components   │
                                  │  & API Routes (/api/*)       │
                                  └──────────────┬──────────────┘
                                                 │
                          ┌──────────────────────┼──────────────────────┐
                          │                      │                      │
                ┌─────────▼────────┐   ┌─────────▼────────┐   ┌───────▼────────┐
                │  Supabase        │   │  Supabase        │   │  External APIs  │
                │  PostgreSQL DB   │   │  Auth            │   │  (FRED, Zillow) │
                │                  │   │                  │   │                  │
                │  Tables:         │   │  - Email/Pass    │   │  - Zillow ZHVI   │
                │  - regions       │   │  - OAuth (Google)│   │  - FRED Series   │
                │  - price_trends  │   │  - RLS Policies  │   │  - Census Data   │
                │  - market_metrics│   │                  │   │                  │
                │  - users_prefs   │   │                  │   │                  │
                └──────────────────┘   └──────────────────┘   └────────────────┘

                          ┌──────────────────────────────────────┐
                          │  Vercel Cron Jobs (Daily/Weekly)      │
                          │  - Fetch latest data from APIs        │
                          │  - Clean & transform                  │
                          │  - Upsert into Supabase               │
                          └──────────────────────────────────────┘
```

### 2.3 Database Schema (Supabase PostgreSQL)
```sql
-- Regions table
CREATE TABLE regions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT,
  type TEXT CHECK (type IN ('state', 'metro', 'city', 'zip')),
  latitude DECIMAL,
  longitude DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price Trends (time-series data)
CREATE TABLE price_trends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  region_id UUID REFERENCES regions(id),
  date DATE NOT NULL,
  property_type TEXT CHECK (property_type IN ('residential', 'commercial')),
  median_price DECIMAL,
  price_per_sqft DECIMAL,
  yoy_change DECIMAL,
  mom_change DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market Metrics (snapshot data)
CREATE TABLE market_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  region_id UUID REFERENCES regions(id),
  date DATE NOT NULL,
  property_type TEXT CHECK (property_type IN ('residential', 'commercial')),
  median_days_on_market INTEGER,
  inventory_count INTEGER,
  new_listings INTEGER,
  pending_sales INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Preferences (saved markets)
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  region_id UUID REFERENCES regions(id),
  alerts_enabled BOOLEAN DEFAULT false,
  alert_threshold DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_price_trends_region ON price_trends(region_id);
CREATE INDEX idx_price_trends_date ON price_trends(date);
CREATE INDEX idx_market_metrics_region ON market_metrics(region_id);
```

### 2.4 API Routes (Next.js on Vercel)
| Route                          | Method | Description                          |
|--------------------------------|--------|--------------------------------------|
| `/api/trends`                  | GET    | Get price trends with filters        |
| `/api/regions`                 | GET    | List all regions                     |
| `/api/regions/[id]`           | GET    | Get single region details            |
| `/api/metrics/[regionId]`     | GET    | Get market metrics for a region      |
| `/api/compare`                 | POST   | Compare two regions side-by-side     |
| `/api/cron/ingest`            | POST   | Cron job endpoint for data ingestion |

---

## 3. DEVELOPMENT ROADMAP

### Sprint 1 (Week 1-2): Foundation
- [x] Initialize Next.js project with Tailwind CSS
- [x] Set up Supabase project & database schema
- [x] Configure environment variables for Supabase
- [x] Build dashboard layout (Nav, Sidebar, Main Content)
- [x] Create mock data and seed the database

### Sprint 2 (Week 3-4): Core Visualizations
- [x] Implement KPI summary cards (Median Price, YoY Change, etc.)
- [x] Build trend line charts with Recharts
- [x] Create interactive US heatmap
- [x] Implement property type filter (Residential/Commercial toggle)
- [x] Build Residential & Commercial dedicated pages
- [x] Region search & autocomplete component
- [x] Market comparison tool (side-by-side)

### Sprint 3 (Week 5-6): Data & Auth
- [ ] Set up Vercel Cron jobs for data ingestion
- [ ] Implement Supabase Auth (signup/login)
- [ ] Build user preferences (save favorite markets)
- [ ] Export to PDF/CSV

### Sprint 4 (Week 7-8): Polish & Deploy
- [ ] Price alerts system
- [ ] SEO optimization
- [ ] Netlify landing page
- [ ] Performance testing & launch
