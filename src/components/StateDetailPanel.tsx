'use client';

import React, { useState, useEffect } from 'react';
import { fetchStateTrend } from '@/lib/data';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface StateInfo {
    name: string;
    state: string;
    medianPrice: number;
    pricePerSqft: number;
    yoyChange: number;
    momChange?: number;
    regionId: string;
}

interface StateDetailPanelProps {
    stateInfo: StateInfo;
    propertyType: 'residential' | 'commercial';
    onClose: () => void;
}

// Inline mini-chart using SVG polyline
function MiniTrendChart({ data, color }: { data: { date: string; value: number }[]; color: string }) {
    if (data.length < 2) {
        return (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Not enough data for chart
            </div>
        );
    }

    const values = data.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const width = 100; // percent-based
    const height = 180;
    const padding = { top: 10, bottom: 30, left: 0, right: 0 };
    const chartW = width;
    const chartH = height - padding.top - padding.bottom;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = padding.top + chartH - ((d.value - minVal) / range) * chartH;
        return `${x},${y}`;
    }).join(' ');

    // Area fill path
    const firstX = 0;
    const lastX = 100;
    const areaPath = `M ${firstX},${padding.top + chartH} ` +
        data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = padding.top + chartH - ((d.value - minVal) / range) * chartH;
            return `L ${x},${y}`;
        }).join(' ') +
        ` L ${lastX},${padding.top + chartH} Z`;

    // Show ~5 x-axis labels
    const labelCount = Math.min(5, data.length);
    const labelIndices = Array.from({ length: labelCount }, (_, i) =>
        Math.round(i * (data.length - 1) / (labelCount - 1))
    );

    return (
        <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
            <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                <defs>
                    <linearGradient id="detailGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                    const y = padding.top + chartH - pct * chartH;
                    return (
                        <line key={pct} x1="0" y1={y} x2="100" y2={y}
                            stroke="rgba(255,255,255,0.05)" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
                    );
                })}
                {/* Area */}
                <path d={areaPath} fill="url(#detailGrad)" />
                {/* Line */}
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
                {/* End dot */}
                {data.length > 0 && (() => {
                    const last = data[data.length - 1];
                    const x = 100;
                    const y = padding.top + chartH - ((last.value - minVal) / range) * chartH;
                    return <circle cx={x} cy={y} r="1.5" fill={color} stroke="#fff" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />;
                })()}
            </svg>
            {/* X-axis date labels */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                display: 'flex', justifyContent: 'space-between',
                fontSize: '0.65rem', color: 'var(--text-muted)',
                padding: '0 2px',
            }}>
                {labelIndices.map(idx => (
                    <span key={idx}>{data[idx].date}</span>
                ))}
            </div>
            {/* Y-axis labels */}
            <div style={{
                position: 'absolute', top: padding.top, bottom: padding.bottom, right: '4px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                fontSize: '0.6rem', color: 'var(--text-muted)', pointerEvents: 'none',
            }}>
                <span>${(maxVal / 1000).toFixed(0)}K</span>
                <span>${((minVal + maxVal) / 2000).toFixed(0)}K</span>
                <span>${(minVal / 1000).toFixed(0)}K</span>
            </div>
        </div>
    );
}

export default function StateDetailPanel({ stateInfo, propertyType, onClose }: StateDetailPanelProps) {
    const [trendData, setTrendData] = useState<{ date: string; value: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        fetchStateTrend(stateInfo.regionId, propertyType).then(data => {
            if (!cancelled) {
                setTrendData(data);
                setLoading(false);
            }
        });

        return () => { cancelled = true; };
    }, [stateInfo.regionId, propertyType]);

    const isPositive = stateInfo.yoyChange >= 0;

    return (
        <>
            {/* Backdrop */}
            <div
                className="state-detail-backdrop"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="state-detail-panel">
                {/* Header */}
                <div className="state-detail-header">
                    <div>
                        <h2 className="state-detail-name">{stateInfo.name}</h2>
                        <span className="state-detail-code">{stateInfo.state}</span>
                    </div>
                    <button className="state-detail-close" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                {/* Metrics grid */}
                <div className="state-detail-metrics">
                    <div className="state-detail-metric">
                        <div className="state-detail-metric-label">Median Price</div>
                        <div className="state-detail-metric-value">{formatCurrency(stateInfo.medianPrice)}</div>
                    </div>
                    <div className="state-detail-metric">
                        <div className="state-detail-metric-label">$/sqft</div>
                        <div className="state-detail-metric-value">${stateInfo.pricePerSqft}</div>
                    </div>
                    <div className="state-detail-metric">
                        <div className="state-detail-metric-label">YoY Change</div>
                        <div className={`state-detail-metric-value ${isPositive ? 'positive' : 'negative'}`}>
                            {isPositive ? '▲' : '▼'} {formatPercent(Math.abs(stateInfo.yoyChange))}
                        </div>
                    </div>
                </div>

                {/* Trend chart */}
                <div className="state-detail-chart">
                    <div className="state-detail-chart-title">
                        Historical Price Trend
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                            {propertyType === 'residential' ? 'Median Home Price' : 'Avg $/sqft'}
                        </span>
                    </div>
                    {loading ? (
                        <div className="skeleton" style={{ height: '200px', borderRadius: '8px' }} />
                    ) : (
                        <MiniTrendChart
                            data={trendData}
                            color={isPositive ? '#10b981' : '#ef4444'}
                        />
                    )}
                </div>

                {/* Summary */}
                <div className="state-detail-summary">
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        {trendData.length > 0 && !loading
                            ? `${trendData.length} data points · ${trendData[0]?.date} — ${trendData[trendData.length - 1]?.date}`
                            : 'Loading data range...'
                        }
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.7 }}>
                        {propertyType === 'residential' ? '🏠 Residential' : '🏢 Commercial'} · Live from Supabase
                    </div>
                </div>
            </div>
        </>
    );
}
