# PropPulse — Development Session Notes

> **Dashboard:** https://app.berrypickle.com | **Landing:** https://berrypickle.com
> **Repo:** https://github.com/greatbuyer/proppulse
> **Stack:** Next.js 14 + React 18 + Supabase + Vercel + Netlify

---

## Session 1 — Feb 22, 2026

### What Was Built
- Full Next.js real estate analytics dashboard from scratch
- Supabase database with `regions`, `price_trends`, `market_metrics` tables
- Interactive US Heatmap, Trend Charts, State Rankings, Market Comparison
- Authentication with Supabase Auth
- Export to CSV/PDF
- Responsive design, SEO meta tags
- Deployed: Vercel (dashboard), Netlify (landing page)
- Custom domains: `app.berrypickle.com`, `berrypickle.com`

### Key Decisions
- Next.js 14 App Router (no Pages Router)
- Supabase for both DB + Auth (free tier)
- Recharts for all data visualizations
- Single-page dashboard with tab navigation (Dashboard, Residential, Commercial, Compare)

---

## Session 2 — Feb 23, 2026

### 1. Neo-Brutalist Theme Redesign
- Rewrote `src/app/globals.css` (~1,600 lines) with neo-brutalist design
- New palette: cream `#FFF8E7` background, amber `#FFD166` navbar, near-black `#1a1a2e` borders
- Typography: `Space Grotesk` (headings) + `Space Mono` (numbers)
- 3px solid black borders, hard offset drop shadows (`5px 5px 0px`)
- Colored KPI cards: blue `#DBEAFE`, green `#D1FAE5`, coral `#FFE0D0`, purple `#EDE9FE`
- Landing page (`landing/index.html`) also redesigned to match

### 2. Automated Data Pipeline (Zillow + FRED)
- Created `/api/pipeline` route that auto-fetches real market data
- **Zillow ZHVI**: Downloads free CSV from `files.zillowstatic.com` (no API key needed)
- **FRED API**: Fetches 120 quarterly observations using key `e9d466ed0aaec99e63f775f15973fb0e`
- Pipeline processes 15 states, calculating YoY/MoM changes
- Upserts into Supabase `price_trends` and `market_metrics` tables
- Vercel cron: runs **17th of each month** at 6 AM UTC (Zillow updates on 16th)
- Manual trigger: `https://app.berrypickle.com/api/pipeline?secret=proppulse_pipeline_2026_secret`
- Cleanup endpoint: `/api/pipeline/cleanup?secret=...` (removes invalid seed data)

### 3. Inline Expandable KPI Cards
- Replaced separate `/kpi/[metric]` drill-down pages with inline dropdowns
- Each card shows "▼ View State Breakdown" toggle
- Expanding reveals: Highest/Lowest summary + sortable state-by-state table
- Sort by State name, Value, or YoY change (click column headers)
- Multiple cards can expand simultaneously
- 4th card (Inventory) uses purple accent

### 4. Bug Fixes
- **Critical:** Fixed `onSignIn` → `onSignInClick` prop mismatch in KPI detail page — this was silently breaking ALL Vercel builds, preventing new features from deploying
- Added smooth `scrollTo({ top: 0, behavior: 'smooth' })` on navbar tab clicks

---

## Environment Variables

### Local (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://kbakhwuzxbukdxemwqmj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_APq_3XZiQUVSa1XofsYPUw_D07KyLL2
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...(see .env.local)
FRED_API_KEY=e9d466ed0aaec99e63f775f15973fb0e
API_SECRET=proppulse_pipeline_2026_secret
```

### Vercel Dashboard (must match)
Same 5 variables above must be set in Vercel → Settings → Environment Variables.

---

## Account Usage (as of Feb 23, 2026)

| Service | Plan | Usage | Status |
|---------|------|-------|--------|
| Vercel | Hobby (Free) | 36MB/100GB bandwidth, 11/1M functions | ✅ Safe |
| Supabase | Free | 27MB/500MB database (5%) | ✅ Safe |
| GitHub | Free | ~0/2,000 Actions minutes | ✅ Safe |
| Netlify | Free | 225/300 build credits remaining | ⚠️ Watch |

---

## File Map

```
src/
├── app/
│   ├── globals.css              ← Neo-brutalist theme (1,700+ lines)
│   ├── layout.tsx               ← Root layout + meta
│   ├── page.tsx                 ← Main dashboard page
│   ├── api/
│   │   ├── pipeline/
│   │   │   ├── route.ts         ← Zillow + FRED data pipeline
│   │   │   └── cleanup/route.ts ← Seed data cleanup
│   │   ├── health/route.ts
│   │   └── seed/route.ts
│   └── kpi/[metric]/page.tsx    ← KPI detail page (still exists, but cards use inline dropdowns now)
├── components/
│   ├── KPICard.tsx              ← Expandable card with inline dropdown
│   ├── Navbar.tsx               ← Tabs + scroll-to-top
│   ├── TrendChart.tsx
│   ├── StateRankings.tsx
│   ├── USHeatmap.tsx
│   ├── CompareView.tsx
│   ├── MarketOverview.tsx
│   ├── AuthModal.tsx
│   ├── ExportButton.tsx
│   ├── SavedMarkets.tsx
│   └── Footer.tsx
├── lib/
│   ├── supabase.ts              ← Client-side Supabase (anon key)
│   ├── supabase-admin.ts        ← Server-side Supabase (service role key)
│   ├── data.ts                  ← Data fetching functions
│   ├── auth.ts                  ← Auth helpers
│   ├── utils.ts                 ← Formatting utilities
│   └── export.ts                ← CSV/PDF export
landing/
└── index.html                   ← Neo-brutalist landing page
vercel.json                      ← Cron config + security headers
```

---

## Next Steps (TODO)
- [ ] Add more states to the pipeline (currently 15)
- [ ] Implement price alerts (email notifications)
- [ ] Add commercial property data source
- [ ] Chart enhancements (historical trend in KPI dropdown)
- [ ] Mobile responsive refinements
- [ ] Add loading skeletons to KPI dropdowns
