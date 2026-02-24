'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchLatestTrends, fetchMarketMetrics, PriceTrend, MarketMetric } from '@/lib/data';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCurrentUser, onAuthChange, signOut, AuthUser } from '@/lib/auth';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell
} from 'recharts';

const METRIC_CONFIG: Record<string, {
    title: string;
    subtitle: string;
    icon: string;
    field: string;
    format: (v: number) => string;
    higherIsBetter: boolean;
    color: string;
}> = {
    'median-price': {
        title: 'Median Home Price',
        subtitle: 'State-by-state breakdown of median home prices across tracked markets',
        icon: '🏠',
        field: 'median_price',
        format: (v) => formatCurrency(v),
        higherIsBetter: false,
        color: '#4361EE',
    },
    'price-per-sqft': {
        title: 'Price Per Square Foot',
        subtitle: 'Compare cost efficiency across states with price-per-sqft analysis',
        icon: '📐',
        field: 'price_per_sqft',
        format: (v) => formatCurrency(v),
        higherIsBetter: false,
        color: '#06D6A0',
    },
    'days-on-market': {
        title: 'Average Days on Market',
        subtitle: 'How quickly homes sell in each state — lower means a hotter market',
        icon: '📅',
        field: 'median_days_on_market',
        format: (v) => `${Math.round(v)} days`,
        higherIsBetter: false,
        color: '#FF6B35',
    },
    'inventory': {
        title: 'Total Active Inventory',
        subtitle: 'Number of active property listings by state',
        icon: '📦',
        field: 'inventory_count',
        format: (v) => formatNumber(v),
        higherIsBetter: true,
        color: '#7209B7',
    },
};

type SortField = 'name' | 'value' | 'yoy';
type SortDir = 'asc' | 'desc';

const BAR_COLORS = [
    '#4361EE', '#FF6B35', '#06D6A0', '#FFD166', '#EF476F',
    '#7209B7', '#4CC9F0', '#FF006E', '#C7F464', '#560BAD',
    '#118AB2', '#073B4C', '#F77F00', '#3A86FF', '#8338EC',
];

export default function KPIDetailPage({ params }: { params: { metric: string } }) {
    const router = useRouter();
    const config = METRIC_CONFIG[params.metric];

    const [trends, setTrends] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState<SortField>('value');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [user, setUser] = useState<AuthUser | null>(null);
    const [showAuth, setShowAuth] = useState(false);

    useEffect(() => {
        getCurrentUser().then(setUser);
        const { data: { subscription } } = onAuthChange(setUser);
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const [t, m] = await Promise.all([
                fetchLatestTrends('residential'),
                fetchMarketMetrics('residential'),
            ]);
            setTrends(t);
            setMetrics(m);
            setLoading(false);
        }
        load();
    }, []);

    // Build combined state data
    const stateData = useMemo(() => {
        if (!trends.length && !metrics.length) return [];

        const isMetricField = ['median_days_on_market', 'inventory_count'].includes(config?.field || '');
        const source = isMetricField ? metrics : trends;

        return source.map((item: any) => {
            const region = item.regions || {};
            const name = region.name || 'Unknown';
            const state = region.state || '';

            let value = 0;
            if (config?.field === 'median_days_on_market') {
                value = Number(item.median_days_on_market) || 0;
            } else if (config?.field === 'inventory_count') {
                value = Number(item.inventory_count) || 0;
            } else if (config?.field === 'price_per_sqft') {
                value = Number(item.price_per_sqft) || 0;
            } else {
                value = Number(item.median_price) || 0;
            }

            // Get YoY from trends
            const trendItem = trends.find((t: any) => t.region_id === item.region_id);
            const yoy = trendItem ? Number(trendItem.yoy_change) || 0 : 0;

            return { name, state, value, yoy };
        });
    }, [trends, metrics, config]);

    // Sort
    const sortedData = useMemo(() => {
        return [...stateData].sort((a, b) => {
            let cmp = 0;
            if (sortField === 'name') cmp = a.name.localeCompare(b.name);
            else if (sortField === 'value') cmp = a.value - b.value;
            else if (sortField === 'yoy') cmp = a.yoy - b.yoy;
            return sortDir === 'desc' ? -cmp : cmp;
        });
    }, [stateData, sortField, sortDir]);

    // Summary stats
    const summary = useMemo(() => {
        if (!stateData.length) return { avg: 0, highest: { name: '', value: 0 }, lowest: { name: '', value: 0 } };
        const avg = stateData.reduce((s, d) => s + d.value, 0) / stateData.length;
        const sorted = [...stateData].sort((a, b) => b.value - a.value);
        return { avg, highest: sorted[0], lowest: sorted[sorted.length - 1] };
    }, [stateData]);

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    if (!config) {
        return (
            <div className="app-container">
                <Navbar
                    activeTab="dashboard"
                    onTabChange={() => router.push('/')}
                    user={user}
                    onSignInClick={() => setShowAuth(true)}
                    onSignOut={() => signOut()}
                />
                <div className="kpi-detail-page" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                    <h1>Metric not found</h1>
                    <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
                        The metric &quot;{params.metric}&quot; does not exist.
                    </p>
                    <a href="/" className="kpi-detail-back" style={{ display: 'inline-block', marginTop: '2rem' }}>
                        ← Back to Dashboard
                    </a>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="app-container">
            <Navbar
                activeTab="dashboard"
                onTabChange={() => router.push('/')}
                user={user}
                onSignIn={() => setShowAuth(true)}
                onSignOut={() => signOut()}
            />
            <div className="kpi-detail-page">
                {/* Header */}
                <div className="kpi-detail-header">
                    <a href="/" className="kpi-detail-back">← Back</a>
                    <h1 className="kpi-detail-title">{config.icon} {config.title}</h1>
                </div>
                <p className="kpi-detail-subtitle">{config.subtitle}</p>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                        <p style={{ fontWeight: 700 }}>Loading state data...</p>
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="kpi-detail-summary">
                            <div className="kpi-detail-summary-card" style={{ borderTop: `5px solid ${config.color}` }}>
                                <div className="kpi-detail-summary-label">National Average</div>
                                <div className="kpi-detail-summary-value">{config.format(summary.avg)}</div>
                            </div>
                            <div className="kpi-detail-summary-card" style={{ borderTop: '5px solid #06D6A0' }}>
                                <div className="kpi-detail-summary-label">Highest</div>
                                <div className="kpi-detail-summary-value">{config.format(summary.highest.value)}</div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '4px' }}>
                                    {summary.highest.name}
                                </div>
                            </div>
                            <div className="kpi-detail-summary-card" style={{ borderTop: '5px solid #EF476F' }}>
                                <div className="kpi-detail-summary-label">Lowest</div>
                                <div className="kpi-detail-summary-value">{config.format(summary.lowest.value)}</div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '4px' }}>
                                    {summary.lowest.name}
                                </div>
                            </div>
                        </div>

                        {/* Bar Chart */}
                        <div className="kpi-detail-chart-container">
                            <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
                                📊 {config.title} by State
                            </h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart
                                    data={sortedData}
                                    margin={{ top: 10, right: 30, left: 20, bottom: 60 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                                    <XAxis
                                        dataKey="state"
                                        tick={{ fontSize: 12, fontWeight: 700, fill: '#1a1a2e' }}
                                        angle={-45}
                                        textAnchor="end"
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fontWeight: 600, fill: '#4a4a5a' }}
                                        tickFormatter={(v) => config.field === 'inventory_count'
                                            ? `${(v / 1000).toFixed(0)}K`
                                            : config.field === 'median_days_on_market'
                                                ? `${v}d`
                                                : `$${(v / 1000).toFixed(0)}K`
                                        }
                                    />
                                    <Tooltip
                                        formatter={(value: number) => [config.format(value), config.title]}
                                        labelFormatter={(label) => {
                                            const item = sortedData.find(d => d.state === label);
                                            return item ? item.name : label;
                                        }}
                                        contentStyle={{
                                            background: '#FFFFFF',
                                            border: '3px solid #1a1a2e',
                                            borderRadius: '8px',
                                            fontWeight: 700,
                                            boxShadow: '4px 4px 0px #1a1a2e',
                                        }}
                                    />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} stroke="#1a1a2e" strokeWidth={2}>
                                        {sortedData.map((_, i) => (
                                            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Sortable Table */}
                        <table className="kpi-detail-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}>#</th>
                                    <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer' }}>
                                        State {sortField === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                                    </th>
                                    <th onClick={() => toggleSort('value')} style={{ cursor: 'pointer' }}>
                                        {config.title} {sortField === 'value' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                                    </th>
                                    <th onClick={() => toggleSort('yoy')} style={{ cursor: 'pointer' }}>
                                        YoY Change {sortField === 'yoy' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedData.map((row, i) => (
                                    <tr key={row.state}>
                                        <td>
                                            <span className={`rank-badge ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'default'}`}>
                                                {i + 1}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="state-name">{row.name}</span>
                                            <span className="state-code">{row.state}</span>
                                        </td>
                                        <td style={{ fontFamily: "'Space Mono', monospace" }}>
                                            {config.format(row.value)}
                                        </td>
                                        <td>
                                            <span className={`kpi-change ${row.yoy >= 0 ? 'positive' : 'negative'}`}>
                                                {row.yoy >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(row.yoy))}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </div>
            <Footer />
        </div>
    );
}
