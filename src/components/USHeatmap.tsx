'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchLatestTrends, fetchMarketMetrics } from '@/lib/data';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface StateData {
    name: string;
    state: string;
    medianPrice: number;
    pricePerSqft: number;
    yoyChange: number;
    regionId: string;
}

interface USHeatmapProps {
    propertyType: 'residential' | 'commercial';
    metric?: 'price' | 'yoy';
    onStateClick?: (state: string) => void;
}

// Simplified US state path data for the 15 tracked states
// Each path is an approximate SVG polygon for the state shape
const STATE_PATHS: Record<string, { d: string; labelX: number; labelY: number }> = {
    CA: {
        d: 'M 85 170 L 95 130 L 100 100 L 105 80 L 100 60 L 80 55 L 75 75 L 70 100 L 65 130 L 60 155 L 70 170 Z',
        labelX: 78, labelY: 120,
    },
    WA: {
        d: 'M 90 30 L 135 30 L 140 55 L 100 60 L 90 45 Z',
        labelX: 112, labelY: 45,
    },
    NV: {
        d: 'M 105 80 L 130 80 L 125 135 L 100 140 L 95 130 L 100 100 Z',
        labelX: 112, labelY: 110,
    },
    AZ: {
        d: 'M 100 140 L 125 135 L 140 140 L 150 180 L 135 185 L 105 180 L 95 170 Z',
        labelX: 122, labelY: 162,
    },
    CO: {
        d: 'M 175 115 L 225 115 L 225 148 L 175 148 Z',
        labelX: 200, labelY: 132,
    },
    TX: {
        d: 'M 220 180 L 260 175 L 280 200 L 290 235 L 270 260 L 240 270 L 215 250 L 205 225 L 195 200 Z',
        labelX: 245, labelY: 225,
    },
    IL: {
        d: 'M 350 100 L 370 100 L 375 115 L 372 140 L 365 155 L 355 160 L 345 140 L 348 115 Z',
        labelX: 360, labelY: 128,
    },
    MI: {
        d: 'M 370 50 L 395 45 L 400 60 L 395 80 L 380 90 L 370 85 L 365 70 Z M 350 75 L 370 65 L 368 85 L 355 95 L 345 90 Z',
        labelX: 378, labelY: 72,
    },
    OH: {
        d: 'M 395 100 L 420 95 L 430 105 L 425 130 L 410 135 L 395 130 L 393 115 Z',
        labelX: 412, labelY: 115,
    },
    PA: {
        d: 'M 435 90 L 475 85 L 480 100 L 470 110 L 435 112 L 430 105 Z',
        labelX: 455, labelY: 100,
    },
    NY: {
        d: 'M 460 55 L 490 45 L 500 55 L 495 70 L 485 80 L 475 85 L 455 82 L 440 85 L 435 75 L 445 60 Z',
        labelX: 468, labelY: 70,
    },
    GA: {
        d: 'M 395 185 L 420 180 L 430 195 L 425 220 L 410 230 L 395 225 L 390 205 Z',
        labelX: 410, labelY: 205,
    },
    NC: {
        d: 'M 410 160 L 470 150 L 480 158 L 475 170 L 440 175 L 415 178 L 405 175 Z',
        labelX: 445, labelY: 165,
    },
    TN: {
        d: 'M 350 165 L 410 160 L 415 175 L 405 180 L 350 182 Z',
        labelX: 380, labelY: 172,
    },
    FL: {
        d: 'M 410 230 L 425 225 L 435 230 L 445 260 L 440 285 L 425 295 L 415 280 L 405 255 L 400 240 Z',
        labelX: 425, labelY: 260,
    },
};

function getColorFromValue(value: number, min: number, max: number, metric: 'price' | 'yoy'): string {
    const normalized = max === min ? 0.5 : (value - min) / (max - min);

    if (metric === 'price') {
        // Blue to Cyan to Green gradient
        const hue = 200 + normalized * 160; // 200 (blue) to 360/0 (red-ish end)
        const sat = 70 + normalized * 15;
        const light = 25 + normalized * 30;
        // Actually use a cool-to-warm gradient
        if (normalized < 0.33) {
            // Blue
            const t = normalized / 0.33;
            return `hsl(${210 - t * 10}, ${65 + t * 10}%, ${30 + t * 8}%)`;
        } else if (normalized < 0.66) {
            // Cyan → Green
            const t = (normalized - 0.33) / 0.33;
            return `hsl(${170 - t * 40}, ${75 + t * 5}%, ${38 + t * 5}%)`;
        } else {
            // Green → Amber
            const t = (normalized - 0.66) / 0.34;
            return `hsl(${130 - t * 90}, ${75 + t * 10}%, ${40 + t * 8}%)`;
        }
    } else {
        // YoY: Red (negative) → Yellow (zero) → Green (positive)
        if (value < 0) {
            const t = Math.min(1, Math.abs(value) / 5);
            return `hsl(${0 + (1 - t) * 40}, ${70 + t * 15}%, ${35 + (1 - t) * 10}%)`;
        } else {
            const t = Math.min(1, value / 5);
            return `hsl(${80 + t * 70}, ${60 + t * 20}%, ${35 + t * 10}%)`;
        }
    }
}

export default function USHeatmap({ propertyType, metric = 'price', onStateClick }: USHeatmapProps) {
    const [stateData, setStateData] = useState<Record<string, StateData>>({});
    const [loading, setLoading] = useState(true);
    const [hoveredState, setHoveredState] = useState<string | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [activeMetric, setActiveMetric] = useState<'price' | 'yoy'>(metric);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        async function load() {
            const trends = await fetchLatestTrends(propertyType);
            if (cancelled) return;

            const dataMap: Record<string, StateData> = {};
            trends.forEach((t: any) => {
                const state = t.regions?.state;
                if (state && STATE_PATHS[state]) {
                    dataMap[state] = {
                        name: t.regions?.name ?? state,
                        state,
                        medianPrice: Number(t.median_price),
                        pricePerSqft: Number(t.price_per_sqft),
                        yoyChange: Number(t.yoy_change),
                        regionId: t.region_id,
                    };
                }
            });

            setStateData(dataMap);
            setLoading(false);
        }
        load();
        return () => { cancelled = true; };
    }, [propertyType]);

    const values = Object.values(stateData);
    const priceValues = values.map((d) => d.medianPrice);
    const yoyValues = values.map((d) => d.yoyChange);
    const minPrice = Math.min(...priceValues);
    const maxPrice = Math.max(...priceValues);
    const minYoY = Math.min(...yoyValues);
    const maxYoY = Math.max(...yoyValues);

    const handleMouseMove = useCallback((e: React.MouseEvent, stateCode: string) => {
        const rect = (e.currentTarget as SVGElement).closest('svg')?.getBoundingClientRect();
        if (rect) {
            setTooltipPos({
                x: e.clientX - rect.left + 12,
                y: e.clientY - rect.top - 10,
            });
        }
        setHoveredState(stateCode);
    }, []);

    if (loading) {
        return (
            <div className="chart-container">
                <div className="chart-header">
                    <div>
                        <div className="chart-title">Interactive US Market Heatmap</div>
                        <div className="chart-subtitle">Loading state data...</div>
                    </div>
                </div>
                <div className="skeleton" style={{ height: '320px', borderRadius: '8px' }} />
            </div>
        );
    }

    return (
        <div className="chart-container animate-in animate-delay-2" style={{ position: 'relative' }}>
            <div className="chart-header">
                <div>
                    <div className="chart-title">Interactive US Market Heatmap</div>
                    <div className="chart-subtitle">
                        {propertyType === 'residential' ? 'Residential' : 'Commercial'} ·{' '}
                        {activeMetric === 'price' ? 'Median Price by State' : 'YoY Change by State'}
                    </div>
                </div>
                <div className="toggle-group">
                    <button
                        className={`toggle-btn ${activeMetric === 'price' ? 'active' : ''}`}
                        onClick={() => setActiveMetric('price')}
                    >
                        💰 Price
                    </button>
                    <button
                        className={`toggle-btn ${activeMetric === 'yoy' ? 'active' : ''}`}
                        onClick={() => setActiveMetric('yoy')}
                    >
                        📈 YoY
                    </button>
                </div>
            </div>

            <div className="map-container" style={{ aspectRatio: '16 / 9', position: 'relative' }}>
                <svg
                    viewBox="40 20 480 290"
                    style={{ width: '100%', height: '100%' }}
                >
                    {/* Background */}
                    <defs>
                        <radialGradient id="mapBgGrad" cx="50%" cy="50%" r="60%">
                            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.04)" />
                            <stop offset="100%" stopColor="transparent" />
                        </radialGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>
                    <rect x="40" y="20" width="480" height="290" fill="url(#mapBgGrad)" rx="8" />

                    {/* State paths */}
                    {Object.entries(STATE_PATHS).map(([stateCode, pathData]) => {
                        const data = stateData[stateCode];
                        if (!data) return null;

                        const fillColor = getColorFromValue(
                            activeMetric === 'price' ? data.medianPrice : data.yoyChange,
                            activeMetric === 'price' ? minPrice : minYoY,
                            activeMetric === 'price' ? maxPrice : maxYoY,
                            activeMetric
                        );
                        const isHovered = hoveredState === stateCode;

                        return (
                            <g key={stateCode}>
                                <path
                                    d={pathData.d}
                                    fill={fillColor}
                                    stroke={isHovered ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.15)'}
                                    strokeWidth={isHovered ? 2 : 0.8}
                                    style={{
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        filter: isHovered ? 'brightness(1.3)' : 'none',
                                        opacity: hoveredState && !isHovered ? 0.5 : 1,
                                    }}
                                    onMouseMove={(e) => handleMouseMove(e, stateCode)}
                                    onMouseLeave={() => setHoveredState(null)}
                                    onClick={() => onStateClick?.(stateCode)}
                                />
                                <text
                                    x={pathData.labelX}
                                    y={pathData.labelY}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fill={isHovered ? '#fff' : 'rgba(255,255,255,0.7)'}
                                    fontSize={isHovered ? '9' : '7.5'}
                                    fontWeight={isHovered ? '700' : '600'}
                                    fontFamily="Inter, sans-serif"
                                    style={{ pointerEvents: 'none', transition: 'all 0.2s ease' }}
                                >
                                    {stateCode}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                {/* Tooltip */}
                {hoveredState && stateData[hoveredState] && (
                    <div
                        className="map-tooltip visible"
                        style={{
                            left: tooltipPos.x,
                            top: tooltipPos.y,
                            position: 'absolute',
                            background: '#1a1f35',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '10px',
                            padding: '12px 16px',
                            fontSize: '0.8rem',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                            zIndex: 20,
                            minWidth: '180px',
                            opacity: 1,
                            pointerEvents: 'none',
                        }}
                    >
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>
                            {stateData[hoveredState].name}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ color: '#94a3b8' }}>
                                Median Price:{' '}
                                <span style={{ color: '#f1f5f9', fontWeight: 600 }}>
                                    {formatCurrency(stateData[hoveredState].medianPrice)}
                                </span>
                            </div>
                            <div style={{ color: '#94a3b8' }}>
                                $/sqft:{' '}
                                <span style={{ color: '#f1f5f9', fontWeight: 600 }}>
                                    ${stateData[hoveredState].pricePerSqft}
                                </span>
                            </div>
                            <div style={{ color: '#94a3b8' }}>
                                YoY Change:{' '}
                                <span
                                    style={{
                                        color: stateData[hoveredState].yoyChange >= 0 ? '#10b981' : '#ef4444',
                                        fontWeight: 600,
                                    }}
                                >
                                    {formatPercent(stateData[hoveredState].yoyChange)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '12px',
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                }}
            >
                <span>{activeMetric === 'price' ? formatCurrency(minPrice) : formatPercent(minYoY)}</span>
                <div
                    style={{
                        width: '200px',
                        height: '8px',
                        borderRadius: '4px',
                        background:
                            activeMetric === 'price'
                                ? 'linear-gradient(90deg, hsl(210,65%,30%), hsl(170,75%,38%), hsl(130,75%,40%), hsl(40,85%,48%))'
                                : 'linear-gradient(90deg, hsl(0,85%,35%), hsl(40,70%,45%), hsl(80,60%,35%), hsl(150,80%,45%))',
                    }}
                />
                <span>{activeMetric === 'price' ? formatCurrency(maxPrice) : formatPercent(maxYoY)}</span>
            </div>
        </div>
    );
}
