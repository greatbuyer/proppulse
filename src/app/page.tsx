'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import KPICard from '@/components/KPICard';
import AuthModal from '@/components/AuthModal';
import SavedMarkets from '@/components/SavedMarkets';
import ExportButton from '@/components/ExportButton';
import Footer from '@/components/Footer';

// Lazy load heavy components
const TrendChart = React.lazy(() => import('@/components/TrendChart'));
const StateRankings = React.lazy(() => import('@/components/StateRankings'));
const MarketOverview = React.lazy(() => import('@/components/MarketOverview'));
const USHeatmap = React.lazy(() => import('@/components/USHeatmap'));
const CompareView = React.lazy(() => import('@/components/CompareView'));
import {
    fetchNationalSummary,
    fetchNationalTrend,
    fetchYoYTrend,
} from '@/lib/data';
import { getCurrentUser, signOut, onAuthChange, AuthUser } from '@/lib/auth';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface SummaryData {
    avgPrice: number;
    avgYoY: number;
    avgPSF: number;
    avgDOM: number;
    totalInventory: number;
    latestTrends: any[];
    metrics: any[];
}

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [propertyType, setPropertyType] = useState<'residential' | 'commercial'>('residential');
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [priceTrendData, setPriceTrendData] = useState<{ date: string; value: number }[]>([]);
    const [yoyTrendData, setYoYTrendData] = useState<{ date: string; value: number }[]>([]);
    const [loading, setLoading] = useState(true);

    // Auth state
    const [user, setUser] = useState<AuthUser | null>(null);
    const [showAuth, setShowAuth] = useState(false);

    // Initialize auth
    useEffect(() => {
        getCurrentUser().then(setUser);
        const { data: { subscription } } = onAuthChange(setUser);
        return () => subscription.unsubscribe();
    }, []);

    // Sync property type with active tab
    useEffect(() => {
        if (activeTab === 'residential') setPropertyType('residential');
        if (activeTab === 'commercial') setPropertyType('commercial');
    }, [activeTab]);

    // Fetch data from Supabase when property type changes
    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        async function loadData() {
            const [summaryData, priceData, yoyData] = await Promise.all([
                fetchNationalSummary(propertyType),
                fetchNationalTrend(propertyType),
                fetchYoYTrend(propertyType),
            ]);

            if (!cancelled) {
                setSummary(summaryData);
                setPriceTrendData(priceData);
                setYoYTrendData(yoyData);
                setLoading(false);
            }
        }

        loadData();
        return () => { cancelled = true; };
    }, [propertyType]);

    // Top growing markets from summary
    const topGrowing = useMemo(() => {
        if (!summary?.latestTrends) return [];
        return [...summary.latestTrends]
            .sort((a: any, b: any) => Number(b.yoy_change) - Number(a.yoy_change))
            .slice(0, 8)
            .map((t: any) => ({
                state: t.regions?.state ?? '??',
                name: t.regions?.name ?? 'Unknown',
                yoy: Number(t.yoy_change),
            }));
    }, [summary]);

    // Export data from summary
    const exportData = useMemo(() => {
        if (!summary?.latestTrends) return [];
        return summary.latestTrends.map((t: any) => ({
            State: t.regions?.name ?? 'Unknown',
            Code: t.regions?.state ?? '??',
            'Median Price': Number(t.median_price),
            '$/sqft': Number(t.price_per_sqft),
            'YoY Change %': Number(t.yoy_change),
            'MoM Change %': Number(t.mom_change),
        }));
    }, [summary]);

    // Page header config
    const tabConfig: Record<string, { title: string; desc: string }> = {
        dashboard: {
            title: 'US Real Estate Market Analytics',
            desc: 'Track pricing trends, market activity, and investment opportunities across residential and commercial properties nationwide.',
        },
        residential: {
            title: 'Residential Market Overview',
            desc: 'Explore median home prices, listing activity, and price appreciation across major US states for residential properties.',
        },
        commercial: {
            title: 'Commercial Property Analytics',
            desc: 'Analyze commercial real estate trends including price per sqft, inventory levels, and year-over-year performance.',
        },
        compare: {
            title: 'Market Comparison Tool',
            desc: 'Compare two markets side by side to identify investment opportunities and regional differences.',
        },
    };

    const { title, desc } = tabConfig[activeTab] || tabConfig.dashboard;

    const handleSignOut = async () => {
        await signOut();
        setUser(null);
    };

    const renderTopGrowingList = () => (
        <div className="chart-container animate-in animate-delay-5">
            <div className="chart-header">
                <div>
                    <div className="chart-title">Top Growing Markets</div>
                    <div className="chart-subtitle">States with highest YoY price appreciation</div>
                </div>
            </div>
            <div style={{ padding: 'var(--space-md) 0' }}>
                {topGrowing.map((item, idx) => {
                    const maxYoy = 25;
                    const barWidth = Math.min(100, (Math.abs(item.yoy) / maxYoy) * 100);
                    return (
                        <div
                            key={item.state}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '8px 0',
                                borderBottom: '1px solid var(--border-color)',
                            }}
                        >
                            <span style={{ width: '28px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>
                                {idx + 1}
                            </span>
                            <span style={{ width: '100px', fontSize: '0.85rem', fontWeight: 600, flexShrink: 0 }}>
                                {item.state}
                            </span>
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        height: '8px',
                                        borderRadius: '999px',
                                        background: item.yoy >= 0
                                            ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                                            : 'linear-gradient(90deg, #ef4444, #f59e0b)',
                                        width: `${barWidth}%`,
                                        transition: 'width 0.5s ease',
                                    }}
                                />
                            </div>
                            <span
                                style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    color: item.yoy >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                                    width: '60px',
                                    textAlign: 'right',
                                }}
                            >
                                {item.yoy >= 0 ? '+' : ''}{item.yoy.toFixed(1)}%
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderKPICards = () => {
        if (loading) {
            return (
                <div className="kpi-grid">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="kpi-card">
                            <div className="skeleton" style={{ height: '16px', width: '120px', marginBottom: '12px' }} />
                            <div className="skeleton" style={{ height: '32px', width: '100px', marginBottom: '8px' }} />
                            <div className="skeleton" style={{ height: '20px', width: '80px' }} />
                        </div>
                    ))}
                </div>
            );
        }
        if (!summary) return null;

        // Build state-level data arrays for each KPI
        const priceStateData = summary.latestTrends.map((t: any) => ({
            name: t.regions?.name || 'Unknown',
            state: t.regions?.state || '',
            value: Number(t.median_price) || 0,
            yoy: Number(t.yoy_change) || 0,
        }));

        const psfStateData = summary.latestTrends.map((t: any) => ({
            name: t.regions?.name || 'Unknown',
            state: t.regions?.state || '',
            value: Number(t.price_per_sqft) || 0,
            yoy: Number(t.yoy_change) * 0.85 || 0,
        }));

        const domStateData = summary.metrics.map((m: any) => ({
            name: m.regions?.name || 'Unknown',
            state: m.regions?.state || '',
            value: Number(m.median_days_on_market) || 0,
            yoy: 0,
        }));

        const invStateData = summary.metrics.map((m: any) => ({
            name: m.regions?.name || 'Unknown',
            state: m.regions?.state || '',
            value: Number(m.inventory_count) || 0,
            yoy: 0,
        }));

        return (
            <div className="kpi-grid">
                <KPICard
                    label={propertyType === 'residential' ? 'Median Home Price' : 'Avg Property Price'}
                    value={formatCurrency(summary.avgPrice)}
                    change={summary.avgYoY}
                    icon={<span>{propertyType === 'residential' ? '🏠' : '🏢'}</span>}
                    accent="blue"
                    delay={1}
                    stateData={priceStateData}
                    formatFn={(v) => formatCurrency(v)}
                    metricLabel="Median Price"
                />
                <KPICard
                    label="Price Per Sq Ft"
                    value={`$${summary.avgPSF}`}
                    change={summary.avgYoY * 0.85}
                    icon={<span>📐</span>}
                    accent="green"
                    delay={2}
                    stateData={psfStateData}
                    formatFn={(v) => `$${v}`}
                    metricLabel="$/SqFt"
                />
                <KPICard
                    label="Avg Days on Market"
                    value={`${summary.avgDOM}`}
                    icon={<span>📅</span>}
                    accent="warm"
                    delay={3}
                    stateData={domStateData}
                    formatFn={(v) => `${Math.round(v)} days`}
                    metricLabel="Days"
                />
                <KPICard
                    label="Total Active Inventory"
                    value={formatNumber(summary.totalInventory)}
                    icon={<span>📦</span>}
                    accent="purple"
                    delay={4}
                    stateData={invStateData}
                    formatFn={(v) => formatNumber(v)}
                    metricLabel="Listings"
                />
            </div>
        );
    };

    const renderChartRows = (chartColor: string, chartTitle: string) => (
        <>
            <div className="charts-grid">
                <TrendChart
                    data={priceTrendData}
                    title={chartTitle}
                    subtitle="Quarterly averages across all tracked states (2020–2026)"
                    color={chartColor}
                    label1={propertyType === 'residential' ? 'Median Price' : 'Avg $/sqft'}
                    formatValue={
                        propertyType === 'residential'
                            ? (v: number) => `$${(v / 1000).toFixed(0)}K`
                            : (v: number) => `$${v}`
                    }
                    type="area"
                />
                <TrendChart
                    data={yoyTrendData}
                    title="Year-over-Year Price Change"
                    subtitle="Average YoY % change across all states"
                    color="#10b981"
                    label1="YoY Change %"
                    formatValue={(v: number) => `${v.toFixed(1)}%`}
                    type="area"
                />
            </div>
            <div className="charts-grid">
                <MarketOverview propertyType={propertyType} />
                {renderTopGrowingList()}
            </div>
        </>
    );

    const renderMainContent = () => {
        if (activeTab === 'compare') {
            return <Suspense fallback={<div className="section-card"><div className="skeleton" style={{ height: '400px' }} /></div>}><CompareView propertyType={propertyType} /></Suspense>;
        }

        return (
            <>
                {renderKPICards()}
                {!loading && (
                    <Suspense fallback={<div className="section-card"><div className="skeleton" style={{ height: '400px' }} /></div>}>
                        <div className="charts-full">
                            <USHeatmap propertyType={propertyType} />
                        </div>
                        {renderChartRows(
                            propertyType === 'commercial' ? '#8b5cf6' : '#3b82f6',
                            propertyType === 'residential'
                                ? 'National Median Home Price'
                                : 'National Avg Commercial $/sqft'
                        )}
                        <div id="state-rankings-export">
                            <StateRankings propertyType={propertyType} />
                        </div>
                    </Suspense>
                )}
                {/* Saved Markets section (only for logged-in users) */}
                {user && (activeTab === 'dashboard') && (
                    <div style={{ marginTop: 'var(--space-xl)' }}>
                        <SavedMarkets user={user} />
                    </div>
                )}
            </>
        );
    };

    return (
        <>
            <Navbar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                user={user}
                onSignInClick={() => setShowAuth(true)}
                onSignOut={handleSignOut}
            />

            <AuthModal
                isOpen={showAuth}
                onClose={() => setShowAuth(false)}
                onSuccess={() => getCurrentUser().then(setUser)}
            />

            <main className="main-content">
                {/* Page Header */}
                <div className="page-header animate-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1>{title}</h1>
                            <p>{desc}</p>
                        </div>
                        {activeTab !== 'compare' && exportData.length > 0 && (
                            <ExportButton
                                data={exportData}
                                filename={`proppulse-${propertyType}-${new Date().toISOString().slice(0, 10)}`}
                                pdfElementId="state-rankings-export"
                                pdfTitle={`${title} — State Rankings`}
                            />
                        )}
                    </div>
                    {(activeTab === 'dashboard' || activeTab === 'compare') && (
                        <div className="page-header-actions">
                            <div className="toggle-group">
                                <button
                                    className={`toggle-btn ${propertyType === 'residential' ? 'active' : ''}`}
                                    onClick={() => setPropertyType('residential')}
                                >
                                    🏠 Residential
                                </button>
                                <button
                                    className={`toggle-btn ${propertyType === 'commercial' ? 'active' : ''}`}
                                    onClick={() => setPropertyType('commercial')}
                                >
                                    🏢 Commercial
                                </button>
                            </div>
                            {activeTab === 'dashboard' && (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    {loading ? '⏳ Loading from Supabase...' : '✅ Live data from Supabase'}
                                </span>
                            )}
                        </div>
                    )}
                    {(activeTab === 'residential' || activeTab === 'commercial') && (
                        <div className="page-header-actions">
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                {loading ? '⏳ Loading...' : `✅ Showing ${propertyType} data · Live from Supabase`}
                            </span>
                        </div>
                    )}
                </div>

                {/* Tab Content */}
                {renderMainContent()}
            </main>

            <Footer />
        </>
    );
}
