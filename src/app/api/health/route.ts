import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // Test the connection by querying the regions table
        const { data, error, count } = await supabase
            .from('regions')
            .select('*', { count: 'exact' });

        if (error) {
            return NextResponse.json(
                {
                    status: 'error',
                    message: 'Supabase connection failed',
                    error: error.message,
                    hint: error.hint || 'Make sure you have run the schema.sql file in your Supabase SQL Editor.',
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            status: 'connected',
            message: `Successfully connected to Supabase! Found ${count ?? data?.length ?? 0} regions.`,
            regions: data,
            timestamp: new Date().toISOString(),
        });
    } catch (err: any) {
        return NextResponse.json(
            {
                status: 'error',
                message: 'Unexpected error connecting to Supabase',
                error: err.message,
            },
            { status: 500 }
        );
    }
}
