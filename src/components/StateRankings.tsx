'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { fetchLatestTrends } from '@/lib/data';

interface StateRankingsProps {
    propertyType: 'residential' | 'commercial';
}

export default function StateRankings({ propertyType }: StateRankingsProps) {
    const [rankings, setRankings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        async function load() {
            const trends = await fetchLatestTrends(propertyType);
            if (!cancelled) {
                const sorted = trends
                    .map((t) => ({
                        id: t.id,
                        regionName: (t as any).regions?.name ?? 'Unknown',
                        regionState: (t as any).regions?.state ?? '??',
                        medianPrice: Number(t.median_price),
                        pricePerSqft: Number(t.price_per_sqft),
                        yoyChange: Number(t.yoy_change),
                        momChange: Number(t.mom_change),
                    }))
                    .sort((a, b) => b.medianPrice - a.medianPrice);
                setRankings(sorted);
                setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [propertyType]);

    const maxYoY = rankings.length ? Math.max(...rankings.map((r) => Math.abs(r.yoyChange))) : 1;

    const getRankBadgeClass = (index: number) => {
        if (index === 0) return 'gold';
        if (index === 1) return 'silver';
        if (index === 2) return 'bronze';
        return 'default';
    };

    if (loading) {
        return (
            <div className="section-card">
                <div className="section-card-header">
                    <div className="section-card-title">
                        <span className="icon">📊</span>
                        State Rankings — Loading...
                    </div>
                </div>
                <div style={{ padding: '20px' }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="skeleton" style={{ height: '48px', marginBottom: '8px', borderRadius: '8px' }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="section-card animate-in animate-delay-4">
            <div className="section-card-header">
                <div className="section-card-title">
                    <span className="icon">📊</span>
                    State Rankings — {propertyType === 'residential' ? 'Residential' : 'Commercial'}
                    <span style={{ fontSize: '0.7rem', color: 'var(--accent-green)', marginLeft: '8px', fontWeight: 400 }}>
                        ● Live from Supabase
                    </span>
                </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table className="rankings-table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px' }}>Rank</th>
                            <th>State</th>
                            <th style={{ textAlign: 'right' }}>
                                {propertyType === 'residential' ? 'Median Price' : 'Avg Price'}
                            </th>
                            <th style={{ textAlign: 'right' }}>$/sqft</th>
                            <th style={{ textAlign: 'right' }}>YoY Change</th>
                            <th style={{ width: '140px' }}>Trend</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rankings.map((item, index) => (
                            <tr key={item.id}>
                                <td>
                                    <span className={`rank-badge ${getRankBadgeClass(index)}`}>
                                        {index + 1}
                                    </span>
                                </td>
                                <td>
                                    <span className="state-name">{item.regionName}</span>
                                    <span className="state-code">{item.regionState}</span>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                    {formatCurrency(item.medianPrice)}
                                </td>
                                <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                                    ${item.pricePerSqft}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <span
                                        className={`kpi-change ${item.yoyChange >= 0 ? 'positive' : 'negative'}`}
                                    >
                                        {item.yoyChange >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(item.yoyChange))}
                                    </span>
                                </td>
                                <td>
                                    <div className="trend-bar">
                                        <div
                                            className={`trend-bar-fill ${item.yoyChange >= 0 ? 'positive' : 'negative'}`}
                                            style={{
                                                width: `${Math.min(100, (Math.abs(item.yoyChange) / maxYoY) * 100)}%`,
                                                minWidth: '8px',
                                            }}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
