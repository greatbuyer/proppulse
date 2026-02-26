import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Zillow ZHVI CSV URLs (state-level, all homes, smoothed, seasonally adjusted)
const ZILLOW_ZHVI_URL =
    'https://files.zillowstatic.com/research/public_csvs/zhvi/State_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv';

// FRED API series for national median home price
const FRED_SERIES = 'MSPUS'; // Median Sales Price of Houses Sold

// Commercial multiplier tiers — high-cost states get higher commercial premiums
const COMMERCIAL_TIER: Record<string, 'high' | 'mid' | 'low'> = {
    California: 'high', 'New York': 'high', Massachusetts: 'high',
    'District of Columbia': 'high', Connecticut: 'high', Hawaii: 'high',
    'New Jersey': 'high', Washington: 'high', Colorado: 'high', Maryland: 'high',
    Virginia: 'high', Oregon: 'high',
    Florida: 'mid', Texas: 'mid', Illinois: 'mid', Pennsylvania: 'mid',
    Georgia: 'mid', Arizona: 'mid', Nevada: 'mid', Utah: 'mid',
    Minnesota: 'mid', Tennessee: 'mid', 'North Carolina': 'mid',
    'South Carolina': 'mid', Ohio: 'mid', Michigan: 'mid', Wisconsin: 'mid',
    Missouri: 'mid', Indiana: 'mid', Idaho: 'mid', Montana: 'mid',
    Maine: 'mid', 'New Hampshire': 'mid', Vermont: 'mid',
    'Rhode Island': 'mid', Delaware: 'mid',
    // All others default to 'low'
};

function getCommercialMultipliers(stateName: string) {
    const tier = COMMERCIAL_TIER[stateName] || 'low';
    switch (tier) {
        case 'high':
            return { price: 2.3, psf: 1.9, yoy: 0.8, mom: 0.7, dom: 1.8, inv: 0.18 };
        case 'mid':
            return { price: 2.0, psf: 1.6, yoy: 0.85, mom: 0.75, dom: 1.6, inv: 0.20 };
        case 'low':
            return { price: 1.7, psf: 1.35, yoy: 0.9, mom: 0.8, dom: 2.0, inv: 0.22 };
    }
}

// Map of state abbreviations to full names (all 50 states + DC)
const STATE_MAP: Record<string, string> = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas',
    CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
    FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
    IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
    KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
    MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
    MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
    NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
    NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
    OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
    SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
    VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
    WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia',
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
    const phase = searchParams.get('phase') || 'all'; // 'residential', 'commercial', or 'all'

    // Validate API secret
    if (secret !== process.env.API_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const log: string[] = [];
    const startTime = Date.now();
    log.push(`🚀 Pipeline phase: ${phase}`);

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

        // ---- RESIDENTIAL PHASE ----
        let trendRowsInserted = 0;
        let trendRowsSkipped = 0;
        let metricsUpdated = 0;
        const CHUNK_SIZE = 500;

        if (phase === 'residential' || phase === 'all') {
            // Step 4: BATCH process — collect all rows first, then bulk upsert
            log.push('💾 Processing price trend data...');
            const allTrendRows: any[] = [];

            for (const [stateName, timeSeries] of Array.from(zillowData.entries())) {
                const region = regionMap.get(stateName);
                if (!region) {
                    log.push(`  ⚠ No region found for "${stateName}", skipping`);
                    continue;
                }

                const recentData = timeSeries.filter(
                    (d: { date: string; value: number }) => d.date >= '2020-01-01'
                );
                const quarterlyData = recentData.filter((_: any, i: number) => i % 3 === 0 || i === recentData.length - 1);

                for (let idx = 0; idx < quarterlyData.length; idx++) {
                    const d = quarterlyData[idx];
                    const oneYearAgo = timeSeries.find(
                        (t: { date: string; value: number }) => t.date.substring(0, 7) ===
                            new Date(new Date(d.date).setFullYear(new Date(d.date).getFullYear() - 1))
                                .toISOString().substring(0, 7)
                    );
                    const yoyChange = oneYearAgo
                        ? Math.round(((d.value - oneYearAgo.value) / oneYearAgo.value) * 10000) / 100
                        : 0;
                    const prevMonth = idx > 0 ? quarterlyData[idx - 1] : null;
                    const momChange = prevMonth
                        ? Math.round(((d.value - prevMonth.value) / prevMonth.value) * 10000) / 100
                        : 0;

                    allTrendRows.push({
                        region_id: region.id,
                        date: d.date.substring(0, 10),
                        property_type: 'residential',
                        median_price: d.value,
                        price_per_sqft: Math.round(d.value / 1800),
                        yoy_change: yoyChange,
                        mom_change: momChange,
                    });
                }
            }

            // Bulk upsert in chunks of 500
            for (let i = 0; i < allTrendRows.length; i += CHUNK_SIZE) {
                const chunk = allTrendRows.slice(i, i + CHUNK_SIZE);
                const { error } = await supabaseAdmin
                    .from('price_trends')
                    .upsert(chunk, { onConflict: 'region_id,date,property_type', ignoreDuplicates: false });

                if (error) {
                    // Fallback: delete and re-insert chunk
                    for (const row of chunk) {
                        await supabaseAdmin.from('price_trends').delete()
                            .eq('region_id', row.region_id).eq('date', row.date).eq('property_type', 'residential');
                    }
                    const { error: e2 } = await supabaseAdmin.from('price_trends').insert(chunk);
                    if (e2) { trendRowsSkipped += chunk.length; continue; }
                }
                trendRowsInserted += chunk.length;
            }
            log.push(`  ✓ Upserted ${trendRowsInserted} trend rows (${trendRowsSkipped} skipped)`);

            // Step 5: BATCH market_metrics
            log.push('💾 Updating market metrics...');
            const allMetricsRows: any[] = [];

            for (const [stateName, timeSeries] of Array.from(zillowData.entries())) {
                const region = regionMap.get(stateName);
                if (!region || timeSeries.length < 2) continue;

                const latest = timeSeries[timeSeries.length - 1];
                const prev = timeSeries[timeSeries.length - 2];
                const priceChange = (latest.value - prev.value) / prev.value;

                const baseDom = 45;
                const estimatedDom = Math.max(15, Math.min(120, baseDom + Math.round(-priceChange * 500)));
                const baseInventory = 25000;
                const estimatedInventory = Math.max(5000, Math.min(80000, baseInventory + Math.round(-priceChange * 100000)));

                allMetricsRows.push({
                    region_id: region.id,
                    date: latest.date.substring(0, 10),
                    property_type: 'residential',
                    median_days_on_market: estimatedDom,
                    inventory_count: estimatedInventory,
                    new_listings: Math.round(estimatedInventory * 0.15),
                    pending_sales: Math.round(estimatedInventory * 0.08),
                });
            }

            // Delete all existing residential metrics and bulk insert
            await supabaseAdmin.from('market_metrics').delete().eq('property_type', 'residential');
            const { error: metricsError } = await supabaseAdmin.from('market_metrics').insert(allMetricsRows);
            const metricsResult = metricsError ? 0 : allMetricsRows.length;
            metricsUpdated = metricsResult;
            if (metricsError) log.push(`  ⚠ Metrics error: ${metricsError.message}`);
            log.push(`  ✓ Updated ${metricsUpdated} market metric rows`);
        } // end residential phase

        // ---- COMMERCIAL PHASE ----
        let commercialTrendsInserted = 0;
        let commMetricsUpdated = 0;

        if (phase === 'commercial' || phase === 'all') {
            // Step 6: Generate COMMERCIAL price_trends from residential data
            log.push('🏢 Generating commercial price trends...');
            const commercialTrendRows: any[] = [];

            for (const [stateName, timeSeries] of Array.from(zillowData.entries())) {
                const region = regionMap.get(stateName);
                if (!region) continue;

                const mult = getCommercialMultipliers(stateName);
                const recentData = timeSeries.filter(
                    (d: { date: string; value: number }) => d.date >= '2020-01-01'
                );
                const quarterlyData = recentData.filter((_: any, i: number) => i % 3 === 0 || i === recentData.length - 1);

                for (let idx = 0; idx < quarterlyData.length; idx++) {
                    const d = quarterlyData[idx];
                    const oneYearAgo = timeSeries.find(
                        (t: { date: string; value: number }) => t.date.substring(0, 7) ===
                            new Date(new Date(d.date).setFullYear(new Date(d.date).getFullYear() - 1))
                                .toISOString().substring(0, 7)
                    );
                    const baseYoy = oneYearAgo
                        ? Math.round(((d.value - oneYearAgo.value) / oneYearAgo.value) * 10000) / 100
                        : 0;
                    const prevMonth = idx > 0 ? quarterlyData[idx - 1] : null;
                    const baseMom = prevMonth
                        ? Math.round(((d.value - prevMonth.value) / prevMonth.value) * 10000) / 100
                        : 0;

                    commercialTrendRows.push({
                        region_id: region.id,
                        date: d.date.substring(0, 10),
                        property_type: 'commercial',
                        median_price: Math.round(d.value * mult.price),
                        price_per_sqft: Math.round((d.value / 1800) * mult.psf),
                        yoy_change: Math.round(baseYoy * mult.yoy * 100) / 100,
                        mom_change: Math.round(baseMom * mult.mom * 100) / 100,
                    });
                }
            }

            // Bulk upsert commercial trends
            for (let i = 0; i < commercialTrendRows.length; i += CHUNK_SIZE) {
                const chunk = commercialTrendRows.slice(i, i + CHUNK_SIZE);
                const { error } = await supabaseAdmin
                    .from('price_trends')
                    .upsert(chunk, { onConflict: 'region_id,date,property_type', ignoreDuplicates: false });

                if (error) {
                    for (const row of chunk) {
                        await supabaseAdmin.from('price_trends').delete()
                            .eq('region_id', row.region_id).eq('date', row.date).eq('property_type', 'commercial');
                    }
                    const { error: e2 } = await supabaseAdmin.from('price_trends').insert(chunk);
                    if (e2) continue;
                }
                commercialTrendsInserted += chunk.length;
            }
            log.push(`  ✓ Upserted ${commercialTrendsInserted} commercial trend rows`);

            // Step 7: Generate COMMERCIAL market_metrics
            log.push('🏢 Generating commercial market metrics...');
            const commercialMetricsRows: any[] = [];

            for (const [stateName, timeSeries] of Array.from(zillowData.entries())) {
                const region = regionMap.get(stateName);
                if (!region || timeSeries.length < 2) continue;

                const mult = getCommercialMultipliers(stateName);
                const latest = timeSeries[timeSeries.length - 1];
                const prev = timeSeries[timeSeries.length - 2];
                const priceChange = (latest.value - prev.value) / prev.value;

                const baseDom = 45;
                const resDom = Math.max(15, Math.min(120, baseDom + Math.round(-priceChange * 500)));
                const commercialDom = Math.round(resDom * mult.dom);

                const baseInventory = 25000;
                const resInventory = Math.max(5000, Math.min(80000, baseInventory + Math.round(-priceChange * 100000)));
                const commercialInventory = Math.round(resInventory * mult.inv);

                commercialMetricsRows.push({
                    region_id: region.id,
                    date: latest.date.substring(0, 10),
                    property_type: 'commercial',
                    median_days_on_market: commercialDom,
                    inventory_count: commercialInventory,
                    new_listings: Math.round(commercialInventory * 0.12),
                    pending_sales: Math.round(commercialInventory * 0.05),
                });
            }

            await supabaseAdmin.from('market_metrics').delete().eq('property_type', 'commercial');
            const { error: commMetricsError } = await supabaseAdmin.from('market_metrics').insert(commercialMetricsRows);
            commMetricsUpdated = commMetricsError ? 0 : commercialMetricsRows.length;
            if (commMetricsError) log.push(`  ⚠ Commercial metrics error: ${commMetricsError.message}`);
            log.push(`  ✓ Updated ${commMetricsUpdated} commercial market metric rows`);
        } // end commercial phase

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        log.push(`\n✅ Pipeline (${phase}) completed in ${elapsed}s`);

        return NextResponse.json({
            success: true,
            phase,
            summary: {
                statesProcessed: zillowData.size,
                trendRowsInserted,
                trendRowsSkipped,
                commercialTrendsInserted,
                metricsUpdated,
                commMetricsUpdated,
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
