import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// All 50 US states + DC
const ALL_STATES: { name: string; state: string }[] = [
    { name: 'Alabama', state: 'AL' }, { name: 'Alaska', state: 'AK' },
    { name: 'Arizona', state: 'AZ' }, { name: 'Arkansas', state: 'AR' },
    { name: 'California', state: 'CA' }, { name: 'Colorado', state: 'CO' },
    { name: 'Connecticut', state: 'CT' }, { name: 'Delaware', state: 'DE' },
    { name: 'Florida', state: 'FL' }, { name: 'Georgia', state: 'GA' },
    { name: 'Hawaii', state: 'HI' }, { name: 'Idaho', state: 'ID' },
    { name: 'Illinois', state: 'IL' }, { name: 'Indiana', state: 'IN' },
    { name: 'Iowa', state: 'IA' }, { name: 'Kansas', state: 'KS' },
    { name: 'Kentucky', state: 'KY' }, { name: 'Louisiana', state: 'LA' },
    { name: 'Maine', state: 'ME' }, { name: 'Maryland', state: 'MD' },
    { name: 'Massachusetts', state: 'MA' }, { name: 'Michigan', state: 'MI' },
    { name: 'Minnesota', state: 'MN' }, { name: 'Mississippi', state: 'MS' },
    { name: 'Missouri', state: 'MO' }, { name: 'Montana', state: 'MT' },
    { name: 'Nebraska', state: 'NE' }, { name: 'Nevada', state: 'NV' },
    { name: 'New Hampshire', state: 'NH' }, { name: 'New Jersey', state: 'NJ' },
    { name: 'New Mexico', state: 'NM' }, { name: 'New York', state: 'NY' },
    { name: 'North Carolina', state: 'NC' }, { name: 'North Dakota', state: 'ND' },
    { name: 'Ohio', state: 'OH' }, { name: 'Oklahoma', state: 'OK' },
    { name: 'Oregon', state: 'OR' }, { name: 'Pennsylvania', state: 'PA' },
    { name: 'Rhode Island', state: 'RI' }, { name: 'South Carolina', state: 'SC' },
    { name: 'South Dakota', state: 'SD' }, { name: 'Tennessee', state: 'TN' },
    { name: 'Texas', state: 'TX' }, { name: 'Utah', state: 'UT' },
    { name: 'Vermont', state: 'VT' }, { name: 'Virginia', state: 'VA' },
    { name: 'Washington', state: 'WA' }, { name: 'West Virginia', state: 'WV' },
    { name: 'Wisconsin', state: 'WI' }, { name: 'Wyoming', state: 'WY' },
    { name: 'District of Columbia', state: 'DC' },
];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.API_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const log: string[] = [];

    try {
        // Get existing regions
        const { data: existing } = await supabaseAdmin
            .from('regions')
            .select('name, state');

        const existingNames = new Set((existing || []).map((r: any) => r.name));
        log.push(`📋 Found ${existingNames.size} existing regions`);

        // Find missing states
        const missing = ALL_STATES.filter(s => !existingNames.has(s.name));
        log.push(`📦 ${missing.length} states to add`);

        if (missing.length === 0) {
            log.push('✅ All 50 states + DC already exist!');
            return NextResponse.json({ success: true, added: 0, log });
        }

        // Insert missing regions
        const rows = missing.map(s => ({
            name: s.name,
            state: s.state,
            region_type: 'state',
        }));

        const { error } = await supabaseAdmin
            .from('regions')
            .insert(rows);

        if (error) throw new Error(`Insert error: ${error.message}`);

        log.push(`✅ Added ${missing.length} new states: ${missing.map(s => s.state).join(', ')}`);

        // Verify total
        const { count } = await supabaseAdmin
            .from('regions')
            .select('*', { head: true, count: 'exact' });

        log.push(`📊 Total regions now: ${count}`);

        return NextResponse.json({ success: true, added: missing.length, log });
    } catch (error: any) {
        log.push(`❌ Error: ${error.message}`);
        return NextResponse.json({ success: false, error: error.message, log }, { status: 500 });
    }
}
