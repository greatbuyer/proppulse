'use client';

import React, { useState, useMemo } from 'react';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils';

interface StateRow {
    name: string;
    state: string;
    value: number;
    yoy: number;
}

interface KPICardProps {
    label: string;
    value: string;
    change?: number;
    icon?: React.ReactNode;
    accent?: 'blue' | 'green' | 'warm' | 'purple';
    delay?: number;
    stateData?: StateRow[];
    formatFn?: (v: number) => string;
    metricLabel?: string;
}

export default function KPICard({
    label,
    value,
    change,
    icon,
    accent = 'blue',
    delay = 0,
    stateData = [],
    formatFn = (v) => formatCurrency(v),
    metricLabel = 'Value',
}: KPICardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [sortField, setSortField] = useState<'name' | 'value' | 'yoy'>('value');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const accentClass =
        accent === 'green' ? 'accent-green' :
            accent === 'warm' ? 'accent-warm' :
                accent === 'purple' ? 'accent-purple' : '';

    const sortedData = useMemo(() => {
        return [...stateData].sort((a, b) => {
            let cmp = 0;
            if (sortField === 'name') cmp = a.name.localeCompare(b.name);
            else if (sortField === 'value') cmp = a.value - b.value;
            else if (sortField === 'yoy') cmp = a.yoy - b.yoy;
            return sortDir === 'desc' ? -cmp : cmp;
        });
    }, [stateData, sortField, sortDir]);

    const toggleSort = (field: 'name' | 'value' | 'yoy') => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const summary = useMemo(() => {
        if (!stateData.length) return null;
        const sorted = [...stateData].sort((a, b) => b.value - a.value);
        return { highest: sorted[0], lowest: sorted[sorted.length - 1] };
    }, [stateData]);

    return (
        <div className={`kpi-card-wrapper animate-in animate-delay-${delay}`}>
            <div
                className={`kpi-card ${accentClass} ${isExpanded ? 'expanded' : ''}`}
                onClick={() => stateData.length > 0 && setIsExpanded(!isExpanded)}
                role={stateData.length > 0 ? 'button' : undefined}
                tabIndex={stateData.length > 0 ? 0 : undefined}
                onKeyDown={stateData.length > 0 ? (e) => { if (e.key === 'Enter') setIsExpanded(!isExpanded); } : undefined}
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
                {stateData.length > 0 && (
                    <div className="kpi-toggle-hint">
                        <span className={`kpi-toggle-arrow ${isExpanded ? 'open' : ''}`}>▼</span>
                        <span>{isExpanded ? 'Hide' : 'View'} State Breakdown</span>
                    </div>
                )}
            </div>

            {/* Expandable Dropdown */}
            {isExpanded && stateData.length > 0 && (
                <div className="kpi-dropdown">
                    {/* Mini summary row */}
                    {summary && (
                        <div className="kpi-dropdown-summary">
                            <div className="kpi-dropdown-stat">
                                <span className="kpi-dropdown-stat-label">🔺 Highest</span>
                                <span className="kpi-dropdown-stat-value">{summary.highest.name}</span>
                                <span className="kpi-dropdown-stat-num">{formatFn(summary.highest.value)}</span>
                            </div>
                            <div className="kpi-dropdown-stat">
                                <span className="kpi-dropdown-stat-label">🔻 Lowest</span>
                                <span className="kpi-dropdown-stat-value">{summary.lowest.name}</span>
                                <span className="kpi-dropdown-stat-num">{formatFn(summary.lowest.value)}</span>
                            </div>
                        </div>
                    )}

                    {/* Sortable table */}
                    <table className="kpi-dropdown-table">
                        <thead>
                            <tr>
                                <th style={{ width: '36px' }}>#</th>
                                <th onClick={() => toggleSort('name')} className="kpi-th-sortable">
                                    State {sortField === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th onClick={() => toggleSort('value')} className="kpi-th-sortable">
                                    {metricLabel} {sortField === 'value' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th onClick={() => toggleSort('yoy')} className="kpi-th-sortable">
                                    YoY {sortField === 'yoy' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
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
                                    <td style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                                        {formatFn(row.value)}
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
                </div>
            )}
        </div>
    );
}
