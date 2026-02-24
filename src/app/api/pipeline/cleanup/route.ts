import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Cleanup endpoint to remove old seed data and keep only real pipeline data
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.API_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const log: string[] = [];
    const today = new Date().toISOString().substring(0, 10);

    try {
        // Delete price_trends rows with dates in the future
        log.push(`🗑️ Deleting price_trends with dates after ${today}...`);
        const { error: trendError, count: trendCount } = await supabaseAdmin
            .from('price_trends')
            .delete({ count: 'exact' })
            .gt('date', today);

        if (trendError) throw new Error(`Trend delete error: ${trendError.message}`);
        log.push(`  ✓ Deleted ${trendCount ?? 0} future-dated trend rows`);

        // Delete old seed data that predates our pipeline (before 2020)
        log.push(`🗑️ Deleting price_trends before 2020-01-01...`);
        const { error: oldTrendError, count: oldTrendCount } = await supabaseAdmin
            .from('price_trends')
            .delete({ count: 'exact' })
            .lt('date', '2020-01-01');

        if (oldTrendError) throw new Error(`Old trend delete error: ${oldTrendError.message}`);
        log.push(`  ✓ Deleted ${oldTrendCount ?? 0} pre-2020 trend rows`);

        // Check what's left
        const { count: remainingTrends } = await supabaseAdmin
            .from('price_trends')
            .select('*', { head: true, count: 'exact' });

        const { count: remainingMetrics } = await supabaseAdmin
            .from('market_metrics')
            .select('*', { head: true, count: 'exact' });

        log.push(`\n📊 Remaining data:`);
        log.push(`  • price_trends: ${remainingTrends ?? 0} rows`);
        log.push(`  • market_metrics: ${remainingMetrics ?? 0} rows`);

        // Get date range of remaining data
        const { data: dateRange } = await supabaseAdmin
            .from('price_trends')
            .select('date')
            .order('date', { ascending: true })
            .limit(1);

        const { data: latestDate } = await supabaseAdmin
            .from('price_trends')
            .select('date')
            .order('date', { ascending: false })
            .limit(1);

        if (dateRange?.[0] && latestDate?.[0]) {
            log.push(`  • Date range: ${dateRange[0].date} → ${latestDate[0].date}`);
        }

        log.push(`\n✅ Cleanup complete`);

        return NextResponse.json({ success: true, log });
    } catch (error: any) {
        log.push(`\n❌ Error: ${error.message}`);
        return NextResponse.json({ success: false, error: error.message, log }, { status: 500 });
    }
}
