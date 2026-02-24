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

// SVG path data for all 50 US states + DC
// Approximate polygons on a 550x310 viewBox
const STATE_PATHS: Record<string, { d: string; labelX: number; labelY: number }> = {
    WA: { d: 'M 90 30 L 135 30 L 140 55 L 100 60 L 90 45 Z', labelX: 112, labelY: 45 },
    OR: { d: 'M 65 55 L 100 60 L 140 55 L 135 80 L 105 80 L 65 80 Z', labelX: 100, labelY: 68 },
    CA: { d: 'M 85 170 L 95 130 L 100 100 L 105 80 L 100 60 L 80 55 L 75 75 L 70 100 L 65 130 L 60 155 L 70 170 Z', labelX: 78, labelY: 120 },
    NV: { d: 'M 105 80 L 130 80 L 125 135 L 100 140 L 95 130 L 100 100 Z', labelX: 112, labelY: 110 },
    ID: { d: 'M 135 30 L 155 30 L 160 55 L 155 80 L 135 80 L 140 55 Z', labelX: 148, labelY: 55 },
    UT: { d: 'M 130 80 L 155 80 L 155 115 L 150 135 L 125 135 Z', labelX: 140, labelY: 105 },
    AZ: { d: 'M 100 140 L 125 135 L 150 135 L 155 175 L 135 185 L 105 180 L 95 170 Z', labelX: 125, labelY: 160 },
    MT: { d: 'M 155 30 L 215 30 L 218 60 L 160 55 Z', labelX: 188, labelY: 44 },
    WY: { d: 'M 160 55 L 218 60 L 222 90 L 175 90 L 155 80 Z', labelX: 190, labelY: 75 },
    CO: { d: 'M 175 115 L 225 115 L 225 148 L 175 148 Z', labelX: 200, labelY: 132 },
    NM: { d: 'M 155 148 L 175 148 L 225 148 L 225 190 L 195 200 L 155 195 L 155 175 Z', labelX: 188, labelY: 172 },
    ND: { d: 'M 218 30 L 270 30 L 272 55 L 218 60 Z', labelX: 245, labelY: 44 },
    SD: { d: 'M 218 60 L 272 55 L 275 85 L 222 90 Z', labelX: 248, labelY: 72 },
    NE: { d: 'M 222 90 L 275 85 L 285 105 L 275 115 L 225 115 Z', labelX: 252, labelY: 102 },
    KS: { d: 'M 225 115 L 275 115 L 285 118 L 290 148 L 225 148 Z', labelX: 258, labelY: 132 },
    OK: { d: 'M 225 148 L 290 148 L 295 155 L 300 175 L 260 175 L 225 175 Z', labelX: 262, labelY: 162 },
    TX: { d: 'M 220 180 L 260 175 L 300 175 L 290 200 L 290 235 L 270 260 L 240 270 L 215 250 L 205 225 L 195 200 Z', labelX: 250, labelY: 225 },
    MN: { d: 'M 285 30 L 330 28 L 335 65 L 310 75 L 280 65 L 272 55 Z', labelX: 305, labelY: 50 },
    IA: { d: 'M 280 65 L 310 75 L 335 65 L 345 90 L 330 100 L 285 105 L 275 85 Z', labelX: 310, labelY: 85 },
    MO: { d: 'M 285 105 L 330 100 L 345 110 L 355 120 L 355 160 L 345 165 L 315 165 L 290 148 Z', labelX: 322, labelY: 135 },
    AR: { d: 'M 315 165 L 345 165 L 350 170 L 355 195 L 320 200 L 300 195 L 300 175 Z', labelX: 328, labelY: 182 },
    LA: { d: 'M 320 200 L 355 195 L 365 210 L 370 230 L 355 240 L 340 235 L 325 230 L 310 220 L 300 210 Z', labelX: 340, labelY: 218 },
    WI: { d: 'M 330 30 L 355 35 L 370 50 L 365 75 L 350 85 L 335 65 Z', labelX: 350, labelY: 55 },
    IL: { d: 'M 345 90 L 370 85 L 375 115 L 372 140 L 365 155 L 355 160 L 345 140 L 345 110 Z', labelX: 360, labelY: 125 },
    MS: { d: 'M 355 195 L 380 185 L 385 215 L 380 240 L 365 245 L 355 240 L 365 210 Z', labelX: 370, labelY: 215 },
    MI: { d: 'M 370 50 L 395 45 L 400 60 L 395 80 L 380 90 L 370 85 L 365 70 Z M 350 75 L 370 65 L 368 85 L 355 95 L 345 90 Z', labelX: 378, labelY: 72 },
    IN: { d: 'M 375 95 L 395 90 L 398 115 L 395 140 L 385 145 L 375 115 Z', labelX: 387, labelY: 118 },
    KY: { d: 'M 365 155 L 395 140 L 435 135 L 440 145 L 415 158 L 380 162 L 355 160 Z', labelX: 400, labelY: 150 },
    TN: { d: 'M 350 165 L 380 162 L 415 158 L 440 152 L 465 155 L 465 170 L 410 175 L 350 182 Z', labelX: 405, labelY: 168 },
    AL: { d: 'M 385 180 L 410 175 L 420 180 L 425 220 L 415 235 L 395 230 L 390 205 Z', labelX: 405, labelY: 205 },
    OH: { d: 'M 395 90 L 420 85 L 430 95 L 425 120 L 420 135 L 395 140 L 398 115 Z', labelX: 412, labelY: 112 },
    WV: { d: 'M 430 105 L 445 100 L 455 115 L 450 135 L 440 145 L 435 135 L 425 120 Z', labelX: 440, labelY: 120 },
    VA: { d: 'M 440 145 L 465 130 L 490 130 L 490 145 L 478 155 L 465 155 L 440 152 Z', labelX: 468, labelY: 142 },
    NC: { d: 'M 410 160 L 465 155 L 478 155 L 500 158 L 500 170 L 475 172 L 440 175 L 415 178 L 405 175 Z', labelX: 455, labelY: 165 },
    SC: { d: 'M 420 180 L 440 175 L 470 172 L 465 195 L 445 200 L 425 195 Z', labelX: 445, labelY: 186 },
    GA: { d: 'M 395 195 L 425 195 L 445 200 L 450 220 L 440 235 L 425 240 L 415 235 L 395 230 Z', labelX: 422, labelY: 215 },
    FL: { d: 'M 415 235 L 440 235 L 450 240 L 460 265 L 455 285 L 440 295 L 430 280 L 420 260 L 410 245 Z', labelX: 440, labelY: 265 },
    PA: { d: 'M 435 85 L 475 80 L 483 95 L 478 110 L 445 112 L 430 105 Z', labelX: 458, labelY: 97 },
    NY: { d: 'M 460 50 L 490 42 L 500 52 L 498 68 L 488 78 L 475 80 L 460 82 L 445 85 L 440 75 L 450 60 Z', labelX: 472, labelY: 65 },
    VT: { d: 'M 492 35 L 498 28 L 505 35 L 503 50 L 495 52 L 492 44 Z', labelX: 498, labelY: 42 },
    NH: { d: 'M 498 38 L 505 35 L 510 42 L 508 58 L 502 60 L 498 52 Z', labelX: 504, labelY: 48 },
    ME: { d: 'M 505 15 L 520 10 L 528 25 L 525 45 L 515 50 L 510 42 L 505 35 Z', labelX: 516, labelY: 30 },
    MA: { d: 'M 498 60 L 510 58 L 518 62 L 515 68 L 505 70 L 498 68 Z', labelX: 510, labelY: 64 },
    RI: { d: 'M 510 68 L 515 68 L 517 74 L 512 75 Z', labelX: 514, labelY: 72 },
    CT: { d: 'M 498 68 L 510 68 L 512 78 L 500 80 Z', labelX: 505, labelY: 74 },
    NJ: { d: 'M 483 85 L 490 82 L 492 95 L 488 108 L 482 110 L 478 100 Z', labelX: 486, labelY: 96 },
    DE: { d: 'M 480 110 L 488 108 L 490 120 L 485 124 L 480 118 Z', labelX: 485, labelY: 116 },
    MD: { d: 'M 450 115 L 478 110 L 480 118 L 485 124 L 480 130 L 465 130 L 450 125 Z', labelX: 468, labelY: 122 },
    DC: { d: 'M 470 127 L 475 125 L 477 130 L 472 132 Z', labelX: 473, labelY: 129 },
    AK: { d: 'M 70 240 L 110 235 L 130 248 L 120 270 L 100 275 L 80 265 Z', labelX: 100, labelY: 255 },
    HI: { d: 'M 160 275 L 170 270 L 180 275 L 185 285 L 175 290 L 165 285 Z', labelX: 173, labelY: 280 },
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

                        // Render grey shape for states without data
                        if (!data) {
                            return (
                                <g key={stateCode}>
                                    <path
                                        d={pathData.d}
                                        fill="rgba(200, 200, 200, 0.15)"
                                        stroke="rgba(255,255,255,0.08)"
                                        strokeWidth={0.5}
                                        style={{ cursor: 'default' }}
                                    />
                                    <text
                                        x={pathData.labelX}
                                        y={pathData.labelY}
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        fill="rgba(255,255,255,0.25)"
                                        fontSize="6"
                                        fontWeight="500"
                                        fontFamily="Inter, sans-serif"
                                        style={{ pointerEvents: 'none' }}
                                    >
                                        {stateCode}
                                    </text>
                                </g>
                            );
                        }

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
