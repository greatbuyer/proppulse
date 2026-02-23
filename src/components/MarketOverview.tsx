'use client';

import React, { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { fetchMarketMetrics } from '@/lib/data';

interface MarketOverviewProps {
    propertyType: 'residential' | 'commercial';
}

export default function MarketOverview({ propertyType }: MarketOverviewProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        async function load() {
            const metrics = await fetchMarketMetrics(propertyType);
            if (!cancelled) {
                const chartData = metrics
                    .map((m) => ({
                        name: m.regions?.state ?? '??',
                        fullName: m.regions?.name ?? 'Unknown',
                        daysOnMarket: m.median_days_on_market,
                        inventory: m.inventory_count,
                        newListings: m.new_listings,
                    }))
                    .sort((a, b) => a.daysOnMarket - b.daysOnMarket);
                setData(chartData);
                setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [propertyType]);

    const colors = [
        '#10b981', '#34d399', '#6ee7b7', '#a7f3d0',
        '#3b82f6', '#60a5fa', '#93c5fd',
        '#f59e0b', '#fbbf24', '#fcd34d',
        '#ef4444', '#f87171', '#fca5a5',
        '#8b5cf6', '#a78bfa',
    ];

    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload?.length) return null;
        const d = payload[0].payload;
        return (
            <div
                style={{
                    background: '#1a1f35',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '0.8rem',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}
            >
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>{d.fullName}</div>
                <div style={{ color: '#94a3b8' }}>
                    Days on Market: <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{d.daysOnMarket}</span>
                </div>
                <div style={{ color: '#94a3b8' }}>
                    Active Inventory: <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{d.inventory.toLocaleString()}</span>
                </div>
                <div style={{ color: '#94a3b8' }}>
                    New Listings: <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{d.newListings.toLocaleString()}</span>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="chart-container">
                <div className="chart-header">
                    <div>
                        <div className="chart-title">Median Days on Market</div>
                        <div className="chart-subtitle">Loading...</div>
                    </div>
                </div>
                <div className="skeleton" style={{ height: '280px', borderRadius: '8px' }} />
            </div>
        );
    }

    return (
        <div className="chart-container animate-in animate-delay-4">
            <div className="chart-header">
                <div>
                    <div className="chart-title">Median Days on Market</div>
                    <div className="chart-subtitle">
                        {propertyType === 'residential' ? 'Residential Properties' : 'Commercial Properties'} — by State
                    </div>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.04)"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="name"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="daysOnMarket" radius={[4, 4, 0, 0]}>
                        {data.map((_, index) => (
                            <Cell key={index} fill={colors[index % colors.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
