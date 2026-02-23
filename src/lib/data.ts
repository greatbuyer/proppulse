import { supabase } from './supabase';

// ---------- Types ----------
export interface Region {
    id: string;
    name: string;
    state: string;
    type: string;
    latitude: number;
    longitude: number;
}

export interface PriceTrend {
    id: string;
    region_id: string;
    date: string;
    property_type: 'residential' | 'commercial';
    median_price: number;
    price_per_sqft: number;
    yoy_change: number;
    mom_change: number;
}

export interface MarketMetric {
    id: string;
    region_id: string;
    date: string;
    property_type: 'residential' | 'commercial';
    median_days_on_market: number;
    inventory_count: number;
    new_listings: number;
    pending_sales: number;
}

// ---------- Fetch Regions ----------
export async function fetchRegions(): Promise<Region[]> {
    const { data, error } = await supabase
        .from('regions')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error fetching regions:', error.message);
        return [];
    }
    return data ?? [];
}

// ---------- Fetch Price Trends ----------
export async function fetchPriceTrends(
    propertyType: 'residential' | 'commercial'
): Promise<PriceTrend[]> {
    const { data, error } = await supabase
        .from('price_trends')
        .select('*')
        .eq('property_type', propertyType)
        .order('date', { ascending: true });

    if (error) {
        console.error('Error fetching price trends:', error.message);
        return [];
    }
    return data ?? [];
}

// ---------- Fetch Latest Trends (most recent date) ----------
export async function fetchLatestTrends(
    propertyType: 'residential' | 'commercial'
): Promise<PriceTrend[]> {
    // First get the most recent date
    const { data: dateData } = await supabase
        .from('price_trends')
        .select('date')
        .eq('property_type', propertyType)
        .order('date', { ascending: false })
        .limit(1);

    const latestDate = dateData?.[0]?.date;
    if (!latestDate) return [];

    const { data, error } = await supabase
        .from('price_trends')
        .select('*, regions(name, state)')
        .eq('property_type', propertyType)
        .eq('date', latestDate)
        .order('median_price', { ascending: false });

    if (error) {
        console.error('Error fetching latest trends:', error.message);
        return [];
    }
    return data ?? [];
}

// ---------- Fetch Market Metrics ----------
export async function fetchMarketMetrics(
    propertyType: 'residential' | 'commercial'
): Promise<(MarketMetric & { regions: { name: string; state: string } })[]> {
    const { data, error } = await supabase
        .from('market_metrics')
        .select('*, regions(name, state)')
        .eq('property_type', propertyType);

    if (error) {
        console.error('Error fetching market metrics:', error.message);
        return [];
    }
    return data ?? [];
}

// ---------- Fetch National Trend (aggregated over time) ----------
export async function fetchNationalTrend(
    propertyType: 'residential' | 'commercial'
): Promise<{ date: string; value: number }[]> {
    const { data, error } = await supabase
        .from('price_trends')
        .select('date, median_price, price_per_sqft')
        .eq('property_type', propertyType)
        .order('date', { ascending: true });

    if (error) {
        console.error('Error fetching national trend:', error.message);
        return [];
    }

    // Aggregate by date (average across all regions)
    const dateMap = new Map<string, { sum: number; count: number }>();
    (data ?? []).forEach((row) => {
        const val = propertyType === 'residential' ? row.median_price : row.price_per_sqft;
        const entry = dateMap.get(row.date) || { sum: 0, count: 0 };
        entry.sum += Number(val);
        entry.count += 1;
        dateMap.set(row.date, entry);
    });

    return Array.from(dateMap.entries())
        .map(([date, { sum, count }]) => ({
            date: date.substring(0, 7),
            value: Math.round(sum / count),
        }))
        .filter((_, i, arr) => i % 3 === 0 || i === arr.length - 1); // quarterly sampling
}

// ---------- Fetch YoY Trend (aggregated) ----------
export async function fetchYoYTrend(
    propertyType: 'residential' | 'commercial'
): Promise<{ date: string; value: number }[]> {
    const { data, error } = await supabase
        .from('price_trends')
        .select('date, yoy_change')
        .eq('property_type', propertyType)
        .neq('yoy_change', 0)
        .order('date', { ascending: true });

    if (error) {
        console.error('Error fetching YoY trend:', error.message);
        return [];
    }

    const dateMap = new Map<string, { sum: number; count: number }>();
    (data ?? []).forEach((row) => {
        const entry = dateMap.get(row.date) || { sum: 0, count: 0 };
        entry.sum += Number(row.yoy_change);
        entry.count += 1;
        dateMap.set(row.date, entry);
    });

    return Array.from(dateMap.entries())
        .map(([date, { sum, count }]) => ({
            date: date.substring(0, 7),
            value: Math.round((sum / count) * 100) / 100,
        }))
        .filter((_, i, arr) => i % 3 === 0 || i === arr.length - 1);
}

// ---------- National Summary KPIs ----------
export async function fetchNationalSummary(propertyType: 'residential' | 'commercial') {
    const [latestTrends, metrics] = await Promise.all([
        fetchLatestTrends(propertyType),
        fetchMarketMetrics(propertyType),
    ]);

    const avgPrice = latestTrends.length
        ? Math.round(latestTrends.reduce((s, t) => s + Number(t.median_price), 0) / latestTrends.length)
        : 0;

    const avgYoY = latestTrends.length
        ? Math.round((latestTrends.reduce((s, t) => s + Number(t.yoy_change), 0) / latestTrends.length) * 100) / 100
        : 0;

    const avgPSF = latestTrends.length
        ? Math.round(latestTrends.reduce((s, t) => s + Number(t.price_per_sqft), 0) / latestTrends.length)
        : 0;

    const avgDOM = metrics.length
        ? Math.round(metrics.reduce((s, m) => s + m.median_days_on_market, 0) / metrics.length)
        : 0;

    const totalInventory = metrics.reduce((s, m) => s + m.inventory_count, 0);

    return { avgPrice, avgYoY, avgPSF, avgDOM, totalInventory, latestTrends, metrics };
}
