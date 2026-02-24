# 🏠 PropPulse — US Real Estate Analytics Platform

A comprehensive real estate analytics dashboard tracking US housing market trends with interactive visualizations, live data from Supabase, and professional-grade analytics tools.

![PropPulse Dashboard](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Powered-green?style=flat-square&logo=supabase)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=flat-square&logo=vercel)

## 🚀 Features

- **📊 Interactive Dashboard** — KPI cards, trend charts, and market activity metrics
- **🗺️ US Heatmap** — Color-coded state-level map with Price/YoY toggle
- **📈 Trend Analytics** — Historical price trends and year-over-year performance
- **⚖️ Market Comparison** — Side-by-side comparison of any two markets
- **🔍 Smart Search** — Instant autocomplete search for all tracked states
- **🔐 Auth System** — Supabase Auth for signup/login with saved preferences
- **⭐ Saved Markets** — Track your favorite markets with price alert toggles
- **📥 Export** — Download data as CSV or print-ready PDF reports
- **🏠 Residential + 🏢 Commercial** — Dedicated views per property type

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | **Next.js 14** + React 18 |
| Charts | **Recharts** |
| Database | **Supabase** (PostgreSQL) |
| Auth | **Supabase Auth** |
| Hosting | **Vercel** (Dashboard) + **Netlify** (Landing) |
| Styling | CSS Custom Properties (Dark Theme) |

## 📁 Project Structure

```
├── src/
│   ├── app/
│   │   ├── page.tsx           # Main dashboard page
│   │   ├── layout.tsx         # Root layout + SEO
│   │   ├── globals.css        # Design system
│   │   └── api/               # API routes (health, seed)
│   ├── components/
│   │   ├── Navbar.tsx         # Navigation with auth
│   │   ├── KPICard.tsx        # Metric cards
│   │   ├── TrendChart.tsx     # Line/area charts
│   │   ├── USHeatmap.tsx      # Interactive US map
│   │   ├── CompareView.tsx    # Market comparison
│   │   ├── RegionSearch.tsx   # State autocomplete
│   │   ├── AuthModal.tsx      # Login/signup modal
│   │   ├── SavedMarkets.tsx   # Saved markets panel
│   │   ├── ExportButton.tsx   # CSV/PDF export
│   │   └── ...
│   └── lib/
│       ├── supabase.ts        # DB client
│       ├── data.ts            # Data fetching
│       ├── auth.ts            # Auth + user prefs
│       ├── export.ts          # Export utilities
│       └── utils.ts           # Formatting helpers
├── landing/                   # Netlify landing page
│   └── index.html
├── supabase/                  # Database schema + seeds
├── vercel.json                # Vercel config
├── netlify.toml               # Netlify config
└── docs/                      # Documentation
```

## 🏁 Getting Started

```bash
# Clone and install
git clone https://github.com/YOUR_USERNAME/proppulse.git
cd proppulse
npm install

# Add your Supabase credentials
cp .env.example .env.local
# Edit .env.local with your keys

# Run dev server
npm run dev
```

## 🌐 Deployment

### Vercel (Dashboard)
1. Connect your GitHub repo to Vercel
2. Add environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy — Vercel auto-detects Next.js

### Netlify (Landing Page)
1. Connect your GitHub repo to Netlify
2. Set publish directory to `landing`
3. Deploy — static HTML, zero build step

## 📊 Data Coverage

Tracking all 50 US states + DC with historical data (2020–2026), including median home prices, price per sqft, YoY/MoM changes, inventory levels, and days on market.

## 📄 License

MIT License · Built with ❤️ by PropPulse
