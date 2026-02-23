# PropPulse — Project Quick Reference

## 🌐 Live URLs
- **Landing Page:** https://berrypickle.com (Netlify)
- **Dashboard:** https://app.berrypickle.com (Vercel)
- **GitHub Repo:** https://github.com/greatbuyer/proppulse

## 🔑 Accounts & Services
- **Vercel:** Dashboard hosting (Next.js) — vercel.com
- **Netlify:** Landing page hosting (static HTML) — netlify.com
- **Supabase:** Database + Auth — supabase.com
- **Hostinger:** Domain registrar for berrypickle.com
- **GitHub:** Source code — github.com/greatbuyer

## 📁 Local Project Location
```
c:\Users\vijay\.gemini\antigravity\scratch\real-estate-trends
```

## 🚀 How to Run Locally
```bash
cd c:\Users\vijay\.gemini\antigravity\scratch\real-estate-trends
npm run dev
# Opens at http://localhost:3000
```

## 🔧 How to Deploy Changes
Any push to GitHub auto-deploys to BOTH Vercel and Netlify:
```bash
git add .
git commit -m "your message here"
git push
```

## 📊 Features Implemented
- ✅ Interactive US Heatmap (Price / YoY toggle)
- ✅ KPI Dashboard with live Supabase data
- ✅ Residential & Commercial views
- ✅ Market Comparison (side-by-side)
- ✅ Region Search with autocomplete
- ✅ State Rankings table
- ✅ Trend Charts (Recharts)
- ✅ Supabase Auth (Sign Up / Sign In)
- ✅ Saved Markets with price alert toggles
- ✅ Export to CSV / PDF
- ✅ Legal Disclaimer modal
- ✅ SEO (Open Graph, Twitter Cards, meta tags)
- ✅ Landing page with animated gradients
- ✅ Custom domain (berrypickle.com + app.berrypickle.com)

## 🏗 Tech Stack
- **Frontend:** Next.js 14 + React 18
- **Charts:** Recharts
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Hosting:** Vercel (dashboard) + Netlify (landing)
- **DNS:** Netlify DNS (nameservers) + Hostinger (registrar)

## 🔑 Environment Variables (in .env.local)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

## 🗂 Key Files
| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Main dashboard page |
| `src/app/globals.css` | All styles / design system |
| `src/components/USHeatmap.tsx` | Interactive US map |
| `src/components/CompareView.tsx` | Market comparison |
| `src/components/AuthModal.tsx` | Login/signup modal |
| `src/components/SavedMarkets.tsx` | Saved markets panel |
| `src/components/ExportButton.tsx` | CSV/PDF export |
| `src/lib/data.ts` | Supabase data fetching |
| `src/lib/auth.ts` | Auth + user preferences |
| `landing/index.html` | Netlify landing page |

## 💡 Potential Next Steps
- Add more states to the database
- Implement email-based price alerts (Supabase Edge Functions)
- Add property type filtering (single-family, condo, etc.)
- Mobile app version
- User analytics (Plausible/PostHog)
