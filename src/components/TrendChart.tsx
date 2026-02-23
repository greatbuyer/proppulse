'use client';

import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
    Legend,
} from 'recharts';

interface TrendChartProps {
    data: Array<{ date: string; value: number; value2?: number }>;
    title: string;
    subtitle?: string;
    color?: string;
    color2?: string;
    label1?: string;
    label2?: string;
    formatValue?: (value: number) => string;
    type?: 'line' | 'area';
}

export default function TrendChart({
    data,
    title,
    subtitle,
    color = '#3b82f6',
    color2 = '#10b981',
    label1 = 'Value',
    label2 = 'Value 2',
    formatValue = (v) => `$${(v / 1000).toFixed(0)}K`,
    type = 'area',
}: TrendChartProps) {
    const hasSecondLine = data.some((d) => d.value2 !== undefined);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;
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
                <div style={{ color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>{label}</div>
                {payload.map((entry: any, idx: number) => (
                    <div key={idx} style={{ color: entry.color, fontWeight: 600 }}>
                        {entry.name}: {formatValue(entry.value)}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="chart-container animate-in animate-delay-3">
            <div className="chart-header">
                <div>
                    <div className="chart-title">{title}</div>
                    {subtitle && <div className="chart-subtitle">{subtitle}</div>}
                </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
                {type === 'area' ? (
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                                <stop offset="100%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                            {hasSecondLine && (
                                <linearGradient id={`grad-${color2.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={color2} stopOpacity={0.2} />
                                    <stop offset="100%" stopColor={color2} stopOpacity={0} />
                                </linearGradient>
                            )}
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.04)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                            tickLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatValue}
                            width={65}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {hasSecondLine && <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#94a3b8' }} />}
                        <Area
                            type="monotone"
                            dataKey="value"
                            name={label1}
                            stroke={color}
                            strokeWidth={2.5}
                            fill={`url(#grad-${color.replace('#', '')})`}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 2, stroke: color }}
                        />
                        {hasSecondLine && (
                            <Area
                                type="monotone"
                                dataKey="value2"
                                name={label2}
                                stroke={color2}
                                strokeWidth={2}
                                fill={`url(#grad-${color2.replace('#', '')})`}
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 2, stroke: color2 }}
                            />
                        )}
                    </AreaChart>
                ) : (
                    <LineChart data={data}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.04)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatValue}
                            width={65}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="value"
                            name={label1}
                            stroke={color}
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 4 }}
                        />
                    </LineChart>
                )}
            </ResponsiveContainer>
        </div>
    );
}
