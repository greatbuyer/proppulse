---
description: Run a full health check on berrypickle.com - check homepage, API, Supabase, and commercial data
---

# Health Check Workflow

// turbo-all

## Steps

1. Check the homepage loads:
```
curl -sf https://berrypickle.com -o /dev/null -w "HTTP Status: %{http_code}\n"
```

2. Check the health API endpoint:
```
curl -sf https://berrypickle.com/api/health | python -m json.tool
```

3. Open berrypickle.com in the browser and verify:
   - Homepage renders with KPI cards
   - "Residential" tab shows data (Median Home Price, Price Per Sq Ft, etc.)
   - Click "Commercial" tab and verify it loads commercial data
   - Scroll down and verify the US heatmap renders
   - Check the State Rankings table loads

4. Report findings to the user.
