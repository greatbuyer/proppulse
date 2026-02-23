'use client';

import React from 'react';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils';

interface KPICardProps {
    label: string;
    value: string;
    change?: number;
    icon?: React.ReactNode;
    accent?: 'blue' | 'green' | 'warm';
    delay?: number;
}

export default function KPICard({ label, value, change, icon, accent = 'blue', delay = 0 }: KPICardProps) {
    const accentClass = accent === 'green' ? 'accent-green' : accent === 'warm' ? 'accent-warm' : '';

    return (
        <div
            className={`kpi-card ${accentClass} animate-in animate-delay-${delay}`}
        >
            <div className="kpi-label">
                {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
                {label}
            </div>
            <div className="kpi-value">{value}</div>
            {change !== undefined && (
                <div className={`kpi-change ${change >= 0 ? 'positive' : 'negative'}`}>
                    <span>{change >= 0 ? '▲' : '▼'}</span>
                    <span>{formatPercent(Math.abs(change))} YoY</span>
                </div>
            )}
        </div>
    );
}
