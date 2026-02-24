'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils';

interface KPICardProps {
    label: string;
    value: string;
    change?: number;
    icon?: React.ReactNode;
    accent?: 'blue' | 'green' | 'warm';
    delay?: number;
    metric?: string; // route identifier like 'median-price'
}

export default function KPICard({ label, value, change, icon, accent = 'blue', delay = 0, metric }: KPICardProps) {
    const router = useRouter();
    const accentClass = accent === 'green' ? 'accent-green' : accent === 'warm' ? 'accent-warm' : '';

    const handleClick = () => {
        if (metric) {
            router.push(`/kpi/${metric}`);
        }
    };

    return (
        <div
            className={`kpi-card ${accentClass} animate-in animate-delay-${delay}`}
            onClick={handleClick}
            role={metric ? 'button' : undefined}
            tabIndex={metric ? 0 : undefined}
            onKeyDown={metric ? (e) => { if (e.key === 'Enter') handleClick(); } : undefined}
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
            {metric && (
                <div className="kpi-explore-hint">Click to explore →</div>
            )}
        </div>
    );
}
