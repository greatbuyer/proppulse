'use client';

import React, { useState, useEffect } from 'react';
import {
    getSavedMarkets,
    saveMarket,
    removeSavedMarket,
    toggleAlert,
    UserPreference,
    AuthUser,
} from '@/lib/auth';
import { fetchRegions, Region } from '@/lib/data';
import RegionSearch from './RegionSearch';

interface SavedMarketsProps {
    user: AuthUser;
}

export default function SavedMarkets({ user }: SavedMarketsProps) {
    const [saved, setSaved] = useState<UserPreference[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadSaved = async () => {
        setLoading(true);
        const data = await getSavedMarkets(user.id);
        setSaved(data);
        setLoading(false);
    };

    useEffect(() => {
        loadSaved();
    }, [user.id]);

    const handleAdd = async (region: Region) => {
        if (saved.some((s) => s.region_id === region.id)) return;
        setSaving(true);
        try {
            await saveMarket(user.id, region.id);
            await loadSaved();
        } catch (err) {
            console.error(err);
        }
        setSaving(false);
    };

    const handleRemove = async (regionId: string) => {
        try {
            await removeSavedMarket(user.id, regionId);
            setSaved((prev) => prev.filter((s) => s.region_id !== regionId));
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleAlert = async (pref: UserPreference) => {
        try {
            await toggleAlert(pref.id, !pref.alerts_enabled, 5);
            setSaved((prev) =>
                prev.map((s) =>
                    s.id === pref.id
                        ? { ...s, alerts_enabled: !s.alerts_enabled }
                        : s
                )
            );
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="section-card animate-in">
            <div className="section-card-header">
                <div className="section-card-title">
                    <span className="icon">⭐</span>
                    Saved Markets
                    <span style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', marginLeft: '8px', fontWeight: 400 }}>
                        {saved.length} saved
                    </span>
                </div>
            </div>

            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <RegionSearch onSelect={handleAdd} placeholder="Add a market to track..." />
                {saving && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '12px' }}>
                        Saving...
                    </span>
                )}
            </div>

            {loading ? (
                <div>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="skeleton" style={{ height: '48px', marginBottom: '8px', borderRadius: '8px' }} />
                    ))}
                </div>
            ) : saved.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📌</div>
                    <div style={{ fontWeight: 600 }}>No saved markets yet</div>
                    <div style={{ fontSize: '0.85rem' }}>
                        Use the search above to add markets you want to track
                    </div>
                </div>
            ) : (
                <div>
                    {saved.map((item) => (
                        <div
                            key={item.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                borderBottom: '1px solid var(--border-color)',
                                transition: 'background 0.15s ease',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '1.2rem' }}>🏛️</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                        {item.region_name ?? 'Unknown'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {item.region_state}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <button
                                    onClick={() => handleToggleAlert(item)}
                                    style={{
                                        background: item.alerts_enabled
                                            ? 'var(--accent-green-glow)'
                                            : 'var(--bg-elevated)',
                                        border: `1px solid ${item.alerts_enabled ? 'var(--accent-green)' : 'var(--border-color)'}`,
                                        color: item.alerts_enabled
                                            ? 'var(--accent-green)'
                                            : 'var(--text-muted)',
                                        padding: '4px 10px',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.2s ease',
                                    }}
                                    title={item.alerts_enabled ? 'Disable alerts' : 'Enable price alerts'}
                                >
                                    {item.alerts_enabled ? '🔔 Alerts On' : '🔕 Alerts Off'}
                                </button>
                                <button
                                    onClick={() => handleRemove(item.region_id)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        padding: '4px',
                                        transition: 'color 0.15s',
                                    }}
                                    title="Remove"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
