// ============================================================
// Mock data for development before Supabase is fully set up.
// This data simulates realistic US real estate trends.
// Uses a seeded PRNG for deterministic output (no hydration errors).
// ============================================================

// Seeded PRNG (mulberry32) — deterministic across server & client
function mulberry32(seed: number) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const seededRandom = mulberry32(42);

export interface Region {
    id: string;
    name: string;
    state: string;
    type: 'state' | 'metro' | 'city' | 'zip';
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

// ----- REGIONS -----
export const mockRegions: Region[] = [
    { id: 'r1', name: 'California', state: 'CA', type: 'state', latitude: 36.78, longitude: -119.42 },
    { id: 'r2', name: 'Texas', state: 'TX', type: 'state', latitude: 31.97, longitude: -99.90 },
    { id: 'r3', name: 'Florida', state: 'FL', type: 'state', latitude: 27.66, longitude: -81.52 },
    { id: 'r4', name: 'New York', state: 'NY', type: 'state', latitude: 42.17, longitude: -74.95 },
    { id: 'r5', name: 'Illinois', state: 'IL', type: 'state', latitude: 40.63, longitude: -89.40 },
    { id: 'r6', name: 'Washington', state: 'WA', type: 'state', latitude: 47.75, longitude: -120.74 },
    { id: 'r7', name: 'Colorado', state: 'CO', type: 'state', latitude: 39.55, longitude: -105.78 },
    { id: 'r8', name: 'Arizona', state: 'AZ', type: 'state', latitude: 34.05, longitude: -111.09 },
    { id: 'r9', name: 'Georgia', state: 'GA', type: 'state', latitude: 32.16, longitude: -82.90 },
    { id: 'r10', name: 'North Carolina', state: 'NC', type: 'state', latitude: 35.76, longitude: -79.02 },
    { id: 'r11', name: 'Ohio', state: 'OH', type: 'state', latitude: 40.42, longitude: -82.91 },
    { id: 'r12', name: 'Michigan', state: 'MI', type: 'state', latitude: 44.31, longitude: -85.60 },
    { id: 'r13', name: 'Pennsylvania', state: 'PA', type: 'state', latitude: 41.20, longitude: -77.19 },
    { id: 'r14', name: 'Nevada', state: 'NV', type: 'state', latitude: 38.80, longitude: -116.42 },
    { id: 'r15', name: 'Tennessee', state: 'TN', type: 'state', latitude: 35.52, longitude: -86.58 },
];

// ----- HELPER: Generate monthly dates -----
function generateMonthlyDates(startYear: number, endYear: number): string[] {
    const dates: string[] = [];
    for (let y = startYear; y <= endYear; y++) {
        for (let m = 1; m <= 12; m++) {
            dates.push(`${y}-${String(m).padStart(2, '0')}-01`);
        }
    }
    return dates;
}

// ----- HELPER: Generate price series with trend -----
function generatePriceSeries(
    basePrice: number,
    annualGrowth: number,
    volatility: number,
    months: number
): number[] {
    const prices: number[] = [];
    let price = basePrice;
    const monthlyGrowth = annualGrowth / 12;

    for (let i = 0; i < months; i++) {
        const noise = (seededRandom() - 0.5) * volatility * 2;
        price = price * (1 + monthlyGrowth + noise);
        prices.push(Math.round(price));
    }
    return prices;
}

// ----- GENERATE PRICE TRENDS -----
const dates = generateMonthlyDates(2020, 2026);

const stateConfigs: Record<string, { resBase: number; resGrowth: number; comBase: number; comGrowth: number }> = {
    r1: { resBase: 550000, resGrowth: 0.06, comBase: 380, comGrowth: 0.04 },
    r2: { resBase: 280000, resGrowth: 0.08, comBase: 220, comGrowth: 0.05 },
    r3: { resBase: 320000, resGrowth: 0.10, comBase: 250, comGrowth: 0.06 },
    r4: { resBase: 420000, resGrowth: 0.04, comBase: 450, comGrowth: 0.03 },
    r5: { resBase: 240000, resGrowth: 0.05, comBase: 200, comGrowth: 0.03 },
    r6: { resBase: 480000, resGrowth: 0.07, comBase: 340, comGrowth: 0.05 },
    r7: { resBase: 430000, resGrowth: 0.06, comBase: 300, comGrowth: 0.04 },
    r8: { resBase: 330000, resGrowth: 0.09, comBase: 240, comGrowth: 0.05 },
    r9: { resBase: 270000, resGrowth: 0.08, comBase: 190, comGrowth: 0.04 },
    r10: { resBase: 290000, resGrowth: 0.07, comBase: 200, comGrowth: 0.04 },
    r11: { resBase: 190000, resGrowth: 0.05, comBase: 150, comGrowth: 0.03 },
    r12: { resBase: 210000, resGrowth: 0.06, comBase: 160, comGrowth: 0.03 },
    r13: { resBase: 250000, resGrowth: 0.05, comBase: 180, comGrowth: 0.03 },
    r14: { resBase: 360000, resGrowth: 0.08, comBase: 260, comGrowth: 0.05 },
    r15: { resBase: 270000, resGrowth: 0.09, comBase: 190, comGrowth: 0.05 },
};

export const mockPriceTrends: PriceTrend[] = [];
let trendId = 0;

for (const region of mockRegions) {
    const cfg = stateConfigs[region.id];
    const resPrices = generatePriceSeries(cfg.resBase, cfg.resGrowth, 0.008, dates.length);
    const comPrices = generatePriceSeries(cfg.comBase, cfg.comGrowth, 0.006, dates.length);

    dates.forEach((date, idx) => {
        const prevResIdx = Math.max(0, idx - 12);
        const prevComIdx = Math.max(0, idx - 12);
        const prevMonthRes = Math.max(0, idx - 1);
        const prevMonthCom = Math.max(0, idx - 1);

        mockPriceTrends.push({
            id: `pt-${trendId++}`,
            region_id: region.id,
            date,
            property_type: 'residential',
            median_price: resPrices[idx],
            price_per_sqft: Math.round(resPrices[idx] / 1800),
            yoy_change: idx >= 12 ? Math.round(((resPrices[idx] - resPrices[prevResIdx]) / resPrices[prevResIdx]) * 10000) / 100 : 0,
            mom_change: idx >= 1 ? Math.round(((resPrices[idx] - resPrices[prevMonthRes]) / resPrices[prevMonthRes]) * 10000) / 100 : 0,
        });

        mockPriceTrends.push({
            id: `pt-${trendId++}`,
            region_id: region.id,
            date,
            property_type: 'commercial',
            median_price: comPrices[idx] * 1000,
            price_per_sqft: comPrices[idx],
            yoy_change: idx >= 12 ? Math.round(((comPrices[idx] - comPrices[prevComIdx]) / comPrices[prevComIdx]) * 10000) / 100 : 0,
            mom_change: idx >= 1 ? Math.round(((comPrices[idx] - comPrices[prevMonthCom]) / comPrices[prevMonthCom]) * 10000) / 100 : 0,
        });
    });
}

// ----- GENERATE MARKET METRICS -----
export const mockMarketMetrics: MarketMetric[] = [];
let metricId = 0;

for (const region of mockRegions) {
    const baseDays = 20 + Math.floor(seededRandom() * 30);
    const baseInventory = 5000 + Math.floor(seededRandom() * 50000);

    mockMarketMetrics.push({
        id: `mm-${metricId++}`,
        region_id: region.id,
        date: '2026-02-01',
        property_type: 'residential',
        median_days_on_market: baseDays + Math.floor(seededRandom() * 10),
        inventory_count: baseInventory + Math.floor(seededRandom() * 5000),
        new_listings: Math.floor(baseInventory * 0.12),
        pending_sales: Math.floor(baseInventory * 0.08),
    });

    mockMarketMetrics.push({
        id: `mm-${metricId++}`,
        region_id: region.id,
        date: '2026-02-01',
        property_type: 'commercial',
        median_days_on_market: baseDays + 20 + Math.floor(seededRandom() * 20),
        inventory_count: Math.floor(baseInventory * 0.3),
        new_listings: Math.floor(baseInventory * 0.04),
        pending_sales: Math.floor(baseInventory * 0.02),
    });
}

// ----- NATIONAL AGGREGATES -----
export function getNationalSummary(propertyType: 'residential' | 'commercial') {
    const latest = mockPriceTrends.filter(
        (pt) => pt.date === '2026-02-01' && pt.property_type === propertyType
    );

    const avgPrice = Math.round(latest.reduce((s, t) => s + t.median_price, 0) / latest.length);
    const avgYoY = Math.round((latest.reduce((s, t) => s + t.yoy_change, 0) / latest.length) * 100) / 100;
    const avgPSF = Math.round(latest.reduce((s, t) => s + t.price_per_sqft, 0) / latest.length);

    const latestMetrics = mockMarketMetrics.filter(
        (mm) => mm.property_type === propertyType
    );
    const avgDOM = Math.round(latestMetrics.reduce((s, m) => s + m.median_days_on_market, 0) / latestMetrics.length);
    const totalInventory = latestMetrics.reduce((s, m) => s + m.inventory_count, 0);

    return { avgPrice, avgYoY, avgPSF, avgDOM, totalInventory };
}
