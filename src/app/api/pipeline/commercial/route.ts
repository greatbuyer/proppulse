import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Commercial multiplier tiers
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
};

function getMultipliers(stateName: string) {
    const tier = COMMERCIAL_TIER[stateName] || 'low';
    switch (tier) {
        case 'high': return { price: 2.3, psf: 1.9, yoy: 0.8, mom: 0.7, dom: 1.8, inv: 0.18 };
        case 'mid': return { price: 2.0, psf: 1.6, yoy: 0.85, mom: 0.75, dom: 1.6, inv: 0.20 };
        case 'low': return { price: 1.7, psf: 1.35, yoy: 0.9, mom: 0.8, dom: 2.0, inv: 0.22 };
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.API_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const log: string[] = [];
    const startTime = Date.now();

    try {
        // Step 1: Get regions
        const { data: regions, error: regError } = await supabaseAdmin
            .from('regions').select('id, name, state');
        if (regError) throw new Error(`Regions error: ${regError.message}`);
        log.push(`✓ Found ${regions?.length || 0} regions`);

        // Build region name lookup
        const regionNames = new Map<string, string>();
        (regions || []).forEach((r: any) => regionNames.set(r.id, r.name));

        // Step 2: Fetch all residential price_trends
        const { data: resTrends, error: resError } = await supabaseAdmin
            .from('price_trends')
            .select('*')
            .eq('property_type', 'residential');
        if (resError) throw new Error(`Res trends error: ${resError.message}`);
        log.push(`✓ Found ${resTrends?.length || 0} residential price_trends`);

        // Step 3: Delete existing commercial price_trends
        await supabaseAdmin.from('price_trends').delete().eq('property_type', 'commercial');
        log.push('✓ Deleted old commercial price_trends');

        // Step 4: Generate and insert commercial price_trends
        const commTrends = (resTrends || []).map((row: any) => {
            const name = regionNames.get(row.region_id) || '';
            const m = getMultipliers(name);
            return {
                region_id: row.region_id,
                date: row.date,
                property_type: 'commercial',
                median_price: Math.round(Number(row.median_price) * m.price),
                price_per_sqft: Math.round(Number(row.price_per_sqft) * m.psf),
                yoy_change: Math.round(Number(row.yoy_change) * m.yoy * 100) / 100,
                mom_change: Math.round(Number(row.mom_change) * m.mom * 100) / 100,
            };
        });

        // Insert in chunks of 500
        let inserted = 0;
        for (let i = 0; i < commTrends.length; i += 500) {
            const chunk = commTrends.slice(i, i + 500);
            const { error } = await supabaseAdmin.from('price_trends').insert(chunk);
            if (error) {
                log.push(`⚠ Chunk ${i}: ${error.message}`);
            } else {
                inserted += chunk.length;
            }
        }
        log.push(`✓ Inserted ${inserted} commercial price_trends`);

        // Step 5: Fetch residential market_metrics
        const { data: resMetrics } = await supabaseAdmin
            .from('market_metrics')
            .select('*')
            .eq('property_type', 'residential');

        // Step 6: Delete and insert commercial market_metrics
        await supabaseAdmin.from('market_metrics').delete().eq('property_type', 'commercial');

        const commMetrics = (resMetrics || []).map((row: any) => {
            const name = regionNames.get(row.region_id) || '';
            const m = getMultipliers(name);
            return {
                region_id: row.region_id,
                date: row.date,
                property_type: 'commercial',
                median_days_on_market: Math.round(Number(row.median_days_on_market) * m.dom),
                inventory_count: Math.round(Number(row.inventory_count) * m.inv),
                new_listings: Math.round(Number(row.inventory_count) * m.inv * 0.12),
                pending_sales: Math.round(Number(row.inventory_count) * m.inv * 0.05),
            };
        });

        const { error: mError } = await supabaseAdmin.from('market_metrics').insert(commMetrics);
        if (mError) log.push(`⚠ Metrics error: ${mError.message}`);
        else log.push(`✓ Inserted ${commMetrics.length} commercial market_metrics`);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        log.push(`\n✅ Commercial pipeline completed in ${elapsed}s`);

        return NextResponse.json({
            success: true,
            summary: { priceTrendsInserted: inserted, metricsInserted: commMetrics.length },
            log,
        });
    } catch (error: any) {
        log.push(`❌ Error: ${error.message}`);
        return NextResponse.json({ success: false, error: error.message, log }, { status: 500 });
    }
}
