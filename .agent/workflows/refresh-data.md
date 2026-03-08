---
description: Refresh the data pipeline to pull latest Zillow and FRED data into Supabase
---

# Data Pipeline Refresh Workflow

## Steps

1. Run the full pipeline (residential + commercial data):
```
curl -sf "https://berrypickle.com/api/pipeline?secret=proppulse_pipeline_2026_secret&phase=all" | python -m json.tool
```

2. Verify the pipeline output shows `"success": true` and check the summary for:
   - `statesProcessed`: should be 51
   - `trendRowsInserted`: should be > 0
   - `commercialTrendsInserted`: should be > 0
   - `metricsUpdated`: should be > 0

3. Run the cleanup to remove stale data:
```
curl -sf "https://berrypickle.com/api/pipeline/cleanup?secret=proppulse_pipeline_2026_secret" | python -m json.tool
```

4. Verify the cleanup output and check remaining data counts.

5. Open berrypickle.com in the browser and verify fresh data is showing.

6. Report the results to the user.
