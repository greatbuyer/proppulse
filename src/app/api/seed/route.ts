import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Seeded PRNG for consistent data generation
function mulberry32(seed: number) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function generateMonthlyDates(startYear: number, endYear: number): string[] {
    const dates: string[] = [];
    for (let y = startYear; y <= endYear; y++) {
        for (let m = 1; m <= 12; m++) {
            dates.push(`${y}-${String(m).padStart(2, '0')}-01`);
        }
    }
    return dates;
}

function generatePriceSeries(
    rng: () => number,
    basePrice: number,
    annualGrowth: number,
    volatility: number,
    months: number
): number[] {
    const prices: number[] = [];
    let price = basePrice;
    const monthlyGrowth = annualGrowth / 12;
    for (let i = 0; i < months; i++) {
        const noise = (rng() - 0.5) * volatility * 2;
        price = price * (1 + monthlyGrowth + noise);
        prices.push(Math.round(price));
    }
    return prices;
}

const stateConfigs: Record<string, { resBase: number; resGrowth: number; comBase: number; comGrowth: number }> = {
    CA: { resBase: 550000, resGrowth: 0.06, comBase: 380, comGrowth: 0.04 },
    TX: { resBase: 280000, resGrowth: 0.08, comBase: 220, comGrowth: 0.05 },
    FL: { resBase: 320000, resGrowth: 0.10, comBase: 250, comGrowth: 0.06 },
    NY: { resBase: 420000, resGrowth: 0.04, comBase: 450, comGrowth: 0.03 },
    IL: { resBase: 240000, resGrowth: 0.05, comBase: 200, comGrowth: 0.03 },
    WA: { resBase: 480000, resGrowth: 0.07, comBase: 340, comGrowth: 0.05 },
    CO: { resBase: 430000, resGrowth: 0.06, comBase: 300, comGrowth: 0.04 },
    AZ: { resBase: 330000, resGrowth: 0.09, comBase: 240, comGrowth: 0.05 },
    GA: { resBase: 270000, resGrowth: 0.08, comBase: 190, comGrowth: 0.04 },
    NC: { resBase: 290000, resGrowth: 0.07, comBase: 200, comGrowth: 0.04 },
    OH: { resBase: 190000, resGrowth: 0.05, comBase: 150, comGrowth: 0.03 },
    MI: { resBase: 210000, resGrowth: 0.06, comBase: 160, comGrowth: 0.03 },
    PA: { resBase: 250000, resGrowth: 0.05, comBase: 180, comGrowth: 0.03 },
    NV: { resBase: 360000, resGrowth: 0.08, comBase: 260, comGrowth: 0.05 },
    TN: { resBase: 270000, resGrowth: 0.09, comBase: 190, comGrowth: 0.05 },
};

export async function POST() {
    const rng = mulberry32(42);

    try {
        // 1. Get all regions from Supabase
        const { data: regions, error: regError } = await supabase
            .from('regions')
            .select('id, state');

        if (regError || !regions?.length) {
            return NextResponse.json(
                { status: 'error', message: 'No regions found. Run schema.sql first.', error: regError?.message },
                { status: 400 }
            );
        }

        const dates = generateMonthlyDates(2020, 2026);

        // 2. Generate and insert price trends (batch in groups of 500)
        const priceTrends: any[] = [];

        for (const region of regions) {
            const cfg = stateConfigs[region.state];
            if (!cfg) continue;

            const resPrices = generatePriceSeries(rng, cfg.resBase, cfg.resGrowth, 0.008, dates.length);
            const comPrices = generatePriceSeries(rng, cfg.comBase, cfg.comGrowth, 0.006, dates.length);

            dates.forEach((date, idx) => {
                const prevRes = Math.max(0, idx - 12);
                const prevCom = Math.max(0, idx - 12);
                const prevMonthRes = Math.max(0, idx - 1);
                const prevMonthCom = Math.max(0, idx - 1);

                priceTrends.push({
                    region_id: region.id,
                    date,
                    property_type: 'residential',
                    median_price: resPrices[idx],
                    price_per_sqft: Math.round(resPrices[idx] / 1800),
                    yoy_change: idx >= 12 ? Math.round(((resPrices[idx] - resPrices[prevRes]) / resPrices[prevRes]) * 10000) / 100 : 0,
                    mom_change: idx >= 1 ? Math.round(((resPrices[idx] - resPrices[prevMonthRes]) / resPrices[prevMonthRes]) * 10000) / 100 : 0,
                });

                priceTrends.push({
                    region_id: region.id,
                    date,
                    property_type: 'commercial',
                    median_price: comPrices[idx] * 1000,
                    price_per_sqft: comPrices[idx],
                    yoy_change: idx >= 12 ? Math.round(((comPrices[idx] - comPrices[prevCom]) / comPrices[prevCom]) * 10000) / 100 : 0,
                    mom_change: idx >= 1 ? Math.round(((comPrices[idx] - comPrices[prevMonthCom]) / comPrices[prevMonthCom]) * 10000) / 100 : 0,
                });
            });
        }

        // Insert in batches of 500
        let insertedPT = 0;
        for (let i = 0; i < priceTrends.length; i += 500) {
            const batch = priceTrends.slice(i, i + 500);
            const { error } = await supabase.from('price_trends').insert(batch);
            if (error) {
                return NextResponse.json(
                    { status: 'error', message: `Failed at price_trends batch ${i}`, error: error.message },
                    { status: 500 }
                );
            }
            insertedPT += batch.length;
        }

        // 3. Generate and insert market metrics
        const marketMetrics: any[] = [];
        const rng2 = mulberry32(123);

        for (const region of regions) {
            const baseDays = 20 + Math.floor(rng2() * 30);
            const baseInventory = 5000 + Math.floor(rng2() * 50000);

            marketMetrics.push({
                region_id: region.id,
                date: '2026-02-01',
                property_type: 'residential',
                median_days_on_market: baseDays + Math.floor(rng2() * 10),
                inventory_count: baseInventory + Math.floor(rng2() * 5000),
                new_listings: Math.floor(baseInventory * 0.12),
                pending_sales: Math.floor(baseInventory * 0.08),
            });

            marketMetrics.push({
                region_id: region.id,
                date: '2026-02-01',
                property_type: 'commercial',
                median_days_on_market: baseDays + 20 + Math.floor(rng2() * 20),
                inventory_count: Math.floor(baseInventory * 0.3),
                new_listings: Math.floor(baseInventory * 0.04),
                pending_sales: Math.floor(baseInventory * 0.02),
            });
        }

        const { error: mmError } = await supabase.from('market_metrics').insert(marketMetrics);
        if (mmError) {
            return NextResponse.json(
                { status: 'error', message: 'Failed to insert market_metrics', error: mmError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            status: 'success',
            message: 'Database seeded successfully!',
            counts: {
                price_trends: insertedPT,
                market_metrics: marketMetrics.length,
            },
        });
    } catch (err: any) {
        return NextResponse.json(
            { status: 'error', message: 'Unexpected error', error: err.message },
            { status: 500 }
        );
    }
}
