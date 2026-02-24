import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Zillow ZHVI CSV URLs (state-level, all homes, smoothed, seasonally adjusted)
const ZILLOW_ZHVI_URL =
    'https://files.zillowstatic.com/research/public_csvs/zhvi/State_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv';

// FRED API series for national median home price
const FRED_SERIES = 'MSPUS'; // Median Sales Price of Houses Sold

// Map of state abbreviations to full names (our 15 tracked states)
const STATE_MAP: Record<string, string> = {
    CA: 'California',
    WA: 'Washington',
    NY: 'New York',
    TX: 'Texas',
    FL: 'Florida',
    CO: 'Colorado',
    AZ: 'Arizona',
    NV: 'Nevada',
    OH: 'Ohio',
    PA: 'Pennsylvania',
    IL: 'Illinois',
    GA: 'Georgia',
    NC: 'North Carolina',
    TN: 'Tennessee',
    MI: 'Michigan',
};

const TRACKED_STATES = new Set(Object.values(STATE_MAP));

interface RegionRow {
    id: string;
    name: string;
    state: string;
}

// ============================================================
// ZILLOW CSV PARSER
// ============================================================
async function fetchZillowData(): Promise<Map<string, { date: string; value: number }[]>> {
    const res = await fetch(ZILLOW_ZHVI_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Zillow fetch failed: ${res.status}`);

    const csvText = await res.text();
    const lines = csvText.split('\n').filter((l) => l.trim());
    const headers = lines[0].split(',');

    // Find date columns (they look like "2020-01-31")
    const dateColStart = headers.findIndex((h) => /^\d{4}-\d{2}/.test(h.trim()));
    const dateHeaders = headers.slice(dateColStart).map((h) => h.trim().replace(/"/g, ''));

    // Find the column indices for RegionName and StateName
    const regionNameIdx = headers.findIndex((h) =>
        h.trim().replace(/"/g, '').toLowerCase() === 'regionname'
    );

    const stateData = new Map<string, { date: string; value: number }[]>();

    for (let i = 1; i < lines.length; i++) {
        // Smart CSV split (handles quoted values)
        const cols = smartSplitCSV(lines[i]);
        const regionName = cols[regionNameIdx]?.replace(/"/g, '').trim();

        // Only process our 15 tracked states
        if (!regionName || !TRACKED_STATES.has(regionName)) continue;

        const timeSeries: { date: string; value: number }[] = [];
        for (let j = dateColStart; j < cols.length && j - dateColStart < dateHeaders.length; j++) {
            const val = parseFloat(cols[j]);
            if (!isNaN(val) && val > 0) {
                timeSeries.push({ date: dateHeaders[j - dateColStart], value: Math.round(val) });
            }
        }

        stateData.set(regionName, timeSeries);
    }

    return stateData;
}

function smartSplitCSV(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// ============================================================
// FRED API FETCHER
// ============================================================
async function fetchFREDNationalMedian(): Promise<{ date: string; value: number }[]> {
    const apiKey = process.env.FRED_API_KEY;
    if (!apiKey) {
        console.warn('FRED_API_KEY not set, skipping FRED data');
        return [];
    }

    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${FRED_SERIES}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=120`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
        console.warn(`FRED fetch failed: ${res.status}`);
        return [];
    }

    const json = await res.json();
    return (json.observations || [])
        .filter((obs: any) => obs.value !== '.')
        .map((obs: any) => ({
            date: obs.date,
            value: Math.round(parseFloat(obs.value) * 1000), // FRED reports in thousands
        }));
}

// ============================================================
// MAIN PIPELINE
// ============================================================
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Validate API secret
    if (secret !== process.env.API_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const log: string[] = [];
    const startTime = Date.now();

    try {
        // Step 1: Get existing regions from Supabase
        log.push('🔍 Fetching regions from Supabase...');
        const { data: regions, error: regError } = await supabaseAdmin
            .from('regions')
            .select('id, name, state');

        if (regError) throw new Error(`Regions fetch error: ${regError.message}`);
        if (!regions || regions.length === 0) throw new Error('No regions found in database');

        const regionMap = new Map<string, RegionRow>();
        regions.forEach((r: RegionRow) => regionMap.set(r.name, r));
        log.push(`  ✓ Found ${regions.length} regions`);

        // Step 2: Fetch Zillow ZHVI data
        log.push('📥 Fetching Zillow ZHVI data...');
        const zillowData = await fetchZillowData();
        log.push(`  ✓ Got data for ${zillowData.size} states`);

        // Step 3: Fetch FRED national data
        log.push('📥 Fetching FRED national median data...');
        const fredData = await fetchFREDNationalMedian();
        log.push(`  ✓ Got ${fredData.length} FRED observations`);

        // Step 4: Process and upsert Zillow data into price_trends
        log.push('💾 Upserting price trend data...');
        let trendRowsInserted = 0;
        let trendRowsSkipped = 0;

        for (const [stateName, timeSeries] of Array.from(zillowData.entries())) {
            const region = regionMap.get(stateName);
            if (!region) {
                log.push(`  ⚠ No region found for "${stateName}", skipping`);
                continue;
            }

            // Only keep data from 2020 onwards to match our schema
            const recentData = timeSeries.filter(
                (d: { date: string; value: number }) => d.date >= '2020-01-01'
            );

            // Sample quarterly (every 3rd month) to avoid too many rows
            const quarterlyData = recentData.filter((_: any, i: number) => i % 3 === 0 || i === recentData.length - 1);

            for (let idx = 0; idx < quarterlyData.length; idx++) {
                const d = quarterlyData[idx];

                // Calculate YoY change
                const oneYearAgo = timeSeries.find(
                    (t: { date: string; value: number }) => t.date.substring(0, 7) ===
                        new Date(new Date(d.date).setFullYear(new Date(d.date).getFullYear() - 1))
                            .toISOString().substring(0, 7)
                );
                const yoyChange = oneYearAgo
                    ? Math.round(((d.value - oneYearAgo.value) / oneYearAgo.value) * 10000) / 100
                    : 0;

                // Calculate MoM change
                const prevMonth = idx > 0 ? quarterlyData[idx - 1] : null;
                const momChange = prevMonth
                    ? Math.round(((d.value - prevMonth.value) / prevMonth.value) * 10000) / 100
                    : 0;

                // Estimate price per sqft (ZHVI is total home value, avg US home ~1800 sqft)
                const avgSqft = 1800;
                const pricePerSqft = Math.round(d.value / avgSqft);

                const row = {
                    region_id: region.id,
                    date: d.date.substring(0, 10),
                    property_type: 'residential' as const,
                    median_price: d.value,
                    price_per_sqft: pricePerSqft,
                    yoy_change: yoyChange,
                    mom_change: momChange,
                };

                const { error } = await supabaseAdmin
                    .from('price_trends')
                    .upsert(row, {
                        onConflict: 'region_id,date,property_type',
                        ignoreDuplicates: false,
                    });

                if (error) {
                    // If upsert fails due to no unique constraint, try insert
                    if (error.code === '42P10' || error.message.includes('unique')) {
                        // Delete existing and insert fresh
                        await supabaseAdmin
                            .from('price_trends')
                            .delete()
                            .eq('region_id', region.id)
                            .eq('date', row.date)
                            .eq('property_type', 'residential');

                        const { error: insertError } = await supabaseAdmin
                            .from('price_trends')
                            .insert(row);

                        if (insertError) {
                            trendRowsSkipped++;
                            continue;
                        }
                    } else {
                        trendRowsSkipped++;
                        continue;
                    }
                }
                trendRowsInserted++;
            }
        }

        log.push(`  ✓ Upserted ${trendRowsInserted} trend rows (${trendRowsSkipped} skipped)`);

        // Step 5: Update market_metrics with estimated data
        // (Zillow doesn't provide days-on-market in ZHVI, so we estimate from price momentum)
        log.push('💾 Updating market metrics...');
        let metricsUpdated = 0;

        for (const [stateName, timeSeries] of Array.from(zillowData.entries())) {
            const region = regionMap.get(stateName);
            if (!region || timeSeries.length < 2) continue;

            const latest = timeSeries[timeSeries.length - 1];
            const prev = timeSeries[timeSeries.length - 2];
            const priceChange = (latest.value - prev.value) / prev.value;

            // Estimate days on market from price momentum
            // Hot markets (rising prices) = lower DOM, cold markets = higher DOM
            const baseDom = 45;
            const domAdjust = Math.round(-priceChange * 500); // ±  days based on momentum
            const estimatedDom = Math.max(15, Math.min(120, baseDom + domAdjust));

            // Estimate inventory (inverse relationship to price growth)
            const baseInventory = 25000;
            const inventoryAdjust = Math.round(-priceChange * 100000);
            const estimatedInventory = Math.max(5000, Math.min(80000, baseInventory + inventoryAdjust));

            const metricsRow = {
                region_id: region.id,
                date: latest.date.substring(0, 10),
                property_type: 'residential' as const,
                median_days_on_market: estimatedDom,
                inventory_count: estimatedInventory,
                new_listings: Math.round(estimatedInventory * 0.15),
                pending_sales: Math.round(estimatedInventory * 0.08),
            };

            // Delete existing and insert
            await supabaseAdmin
                .from('market_metrics')
                .delete()
                .eq('region_id', region.id)
                .eq('property_type', 'residential');

            const { error } = await supabaseAdmin
                .from('market_metrics')
                .insert(metricsRow);

            if (!error) metricsUpdated++;
        }

        log.push(`  ✓ Updated ${metricsUpdated} market metric rows`);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        log.push(`\n✅ Pipeline completed in ${elapsed}s`);

        return NextResponse.json({
            success: true,
            summary: {
                statesProcessed: zillowData.size,
                trendRowsInserted,
                trendRowsSkipped,
                metricsUpdated,
                fredObservations: fredData.length,
                elapsedSeconds: parseFloat(elapsed),
            },
            log,
        });
    } catch (error: any) {
        log.push(`\n❌ Pipeline error: ${error.message}`);
        return NextResponse.json(
            { success: false, error: error.message, log },
            { status: 500 }
        );
    }
}
