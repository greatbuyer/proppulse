'use client';

import React, { useState, useEffect } from 'react';
import { fetchRegions, fetchLatestTrends, fetchMarketMetrics, Region } from '@/lib/data';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils';
import RegionSearch from './RegionSearch';

interface CompareData {
    region: Region;
    medianPrice: number;
    pricePerSqft: number;
    yoyChange: number;
    momChange: number;
    daysOnMarket: number;
    inventory: number;
    newListings: number;
}

interface CompareViewProps {
    propertyType: 'residential' | 'commercial';
}

export default function CompareView({ propertyType }: CompareViewProps) {
    const [regionA, setRegionA] = useState<CompareData | null>(null);
    const [regionB, setRegionB] = useState<CompareData | null>(null);
    const [loadingA, setLoadingA] = useState(false);
    const [loadingB, setLoadingB] = useState(false);
    const [allTrends, setAllTrends] = useState<any[]>([]);
    const [allMetrics, setAllMetrics] = useState<any[]>([]);

    useEffect(() => {
        async function loadAll() {
            const [trends, metrics] = await Promise.all([
                fetchLatestTrends(propertyType),
                fetchMarketMetrics(propertyType),
            ]);
            setAllTrends(trends);
            setAllMetrics(metrics);
        }
        loadAll();
    }, [propertyType]);

    function findDataForRegion(region: Region): CompareData | null {
        const trend = allTrends.find((t: any) => t.region_id === region.id);
        const metric = allMetrics.find((m: any) => m.region_id === region.id);
        if (!trend) return null;

        return {
            region,
            medianPrice: Number(trend.median_price),
            pricePerSqft: Number(trend.price_per_sqft),
            yoyChange: Number(trend.yoy_change),
            momChange: Number(trend.mom_change),
            daysOnMarket: metric?.median_days_on_market ?? 0,
            inventory: metric?.inventory_count ?? 0,
            newListings: metric?.new_listings ?? 0,
        };
    }

    const handleSelectA = (region: Region) => {
        const data = findDataForRegion(region);
        if (data) setRegionA(data);
    };

    const handleSelectB = (region: Region) => {
        const data = findDataForRegion(region);
        if (data) setRegionB(data);
    };

    const renderMetricRow = (
        label: string,
        icon: string,
        valueA: string | number | undefined,
        valueB: string | number | undefined,
        diffFn?: (a: number, b: number) => string,
        rawA?: number,
        rawB?: number
    ) => {
        const diff =
            rawA !== undefined && rawB !== undefined && diffFn
                ? diffFn(rawA, rawB)
                : null;
        const winner =
            rawA !== undefined && rawB !== undefined
                ? rawA > rawB
                    ? 'a'
                    : rawA < rawB
                        ? 'b'
                        : 'tie'
                : null;

        return (
            <div className="compare-row">
                <div className={`compare-cell left ${winner === 'a' ? 'winner' : ''}`}>
                    {valueA !== undefined ? valueA : '—'}
                </div>
                <div className="compare-cell center">
                    <span className="compare-icon">{icon}</span>
                    <span className="compare-label">{label}</span>
                    {diff && (
                        <span className="compare-diff">{diff}</span>
                    )}
                </div>
                <div className={`compare-cell right ${winner === 'b' ? 'winner' : ''}`}>
                    {valueB !== undefined ? valueB : '—'}
                </div>
            </div>
        );
    };

    return (
        <div className="compare-container animate-in">
            <div className="compare-header">
                <div className="compare-search-panel">
                    <div className="compare-panel-label">Market A</div>
                    <RegionSearch
                        onSelect={handleSelectA}
                        placeholder="Search first state..."
                    />
                    {regionA && (
                        <div className="compare-selected">
                            <span className="compare-selected-name">{regionA.region.name}</span>
                            <span className="compare-selected-code">{regionA.region.state}</span>
                        </div>
                    )}
                </div>

                <div className="compare-vs">
                    <div className="compare-vs-circle">VS</div>
                </div>

                <div className="compare-search-panel">
                    <div className="compare-panel-label">Market B</div>
                    <RegionSearch
                        onSelect={handleSelectB}
                        placeholder="Search second state..."
                    />
                    {regionB && (
                        <div className="compare-selected">
                            <span className="compare-selected-name">{regionB.region.name}</span>
                            <span className="compare-selected-code">{regionB.region.state}</span>
                        </div>
                    )}
                </div>
            </div>

            {regionA && regionB ? (
                <div className="compare-table animate-in animate-delay-2">
                    <div className="compare-table-header">
                        <div className="compare-cell left header">
                            <span style={{ fontSize: '1.2rem' }}>🏛️</span> {regionA.region.name}
                        </div>
                        <div className="compare-cell center header">
                            METRIC
                        </div>
                        <div className="compare-cell right header">
                            {regionB.region.name} <span style={{ fontSize: '1.2rem' }}>🏛️</span>
                        </div>
                    </div>

                    {renderMetricRow(
                        'Median Price',
                        '💰',
                        formatCurrency(regionA.medianPrice),
                        formatCurrency(regionB.medianPrice),
                        (a, b) => {
                            const diff = ((a - b) / b) * 100;
                            return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
                        },
                        regionA.medianPrice,
                        regionB.medianPrice
                    )}
                    {renderMetricRow(
                        'Price/sqft',
                        '📐',
                        `$${regionA.pricePerSqft}`,
                        `$${regionB.pricePerSqft}`,
                        (a, b) => `$${Math.abs(a - b)} diff`,
                        regionA.pricePerSqft,
                        regionB.pricePerSqft
                    )}
                    {renderMetricRow(
                        'YoY Change',
                        '📈',
                        formatPercent(regionA.yoyChange),
                        formatPercent(regionB.yoyChange),
                        (a, b) => `${(a - b).toFixed(2)}pp diff`,
                        regionA.yoyChange,
                        regionB.yoyChange
                    )}
                    {renderMetricRow(
                        'MoM Change',
                        '📊',
                        formatPercent(regionA.momChange),
                        formatPercent(regionB.momChange),
                        undefined,
                        regionA.momChange,
                        regionB.momChange
                    )}
                    {renderMetricRow(
                        'Days on Market',
                        '📅',
                        `${regionA.daysOnMarket} days`,
                        `${regionB.daysOnMarket} days`,
                        (a, b) => `${Math.abs(a - b)} days diff`,
                        regionA.daysOnMarket,
                        regionB.daysOnMarket
                    )}
                    {renderMetricRow(
                        'Inventory',
                        '📦',
                        formatNumber(regionA.inventory),
                        formatNumber(regionB.inventory),
                        (a, b) => {
                            const diff = ((a - b) / b) * 100;
                            return `${diff >= 0 ? '+' : ''}${diff.toFixed(0)}%`;
                        },
                        regionA.inventory,
                        regionB.inventory
                    )}
                    {renderMetricRow(
                        'New Listings',
                        '🏗️',
                        formatNumber(regionA.newListings),
                        formatNumber(regionB.newListings),
                        undefined,
                        regionA.newListings,
                        regionB.newListings
                    )}
                </div>
            ) : (
                <div className="compare-placeholder">
                    <div className="compare-placeholder-icon">⚖️</div>
                    <div className="compare-placeholder-title">Select Two Markets to Compare</div>
                    <div className="compare-placeholder-desc">
                        Choose two states from the search boxes above to see a detailed side-by-side
                        comparison of real estate metrics.
                    </div>
                </div>
            )}
        </div>
    );
}
