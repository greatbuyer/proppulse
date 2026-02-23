'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchRegions, Region } from '@/lib/data';

interface RegionSearchProps {
    onSelect: (region: Region) => void;
    placeholder?: string;
}

export default function RegionSearch({ onSelect, placeholder = 'Search states...' }: RegionSearchProps) {
    const [query, setQuery] = useState('');
    const [regions, setRegions] = useState<Region[]>([]);
    const [filtered, setFiltered] = useState<Region[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchRegions().then(setRegions);
    }, []);

    useEffect(() => {
        if (query.trim() === '') {
            setFiltered(regions.slice(0, 8));
        } else {
            const q = query.toLowerCase();
            setFiltered(
                regions
                    .filter(
                        (r) =>
                            r.name.toLowerCase().includes(q) ||
                            r.state.toLowerCase().includes(q)
                    )
                    .slice(0, 8)
            );
        }
        setActiveIndex(-1);
    }, [query, regions]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = useCallback(
        (region: Region) => {
            setQuery(region.name);
            setIsOpen(false);
            onSelect(region);
        },
        [onSelect]
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((prev) => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault();
            handleSelect(filtered[activeIndex]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return (
        <div ref={containerRef} className="region-search-container" style={{ position: 'relative' }}>
            <div className="region-search-input-wrap">
                <span className="region-search-icon">🔍</span>
                <input
                    ref={inputRef}
                    type="text"
                    className="region-search-input"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoComplete="off"
                />
                {query && (
                    <button
                        className="region-search-clear"
                        onClick={() => {
                            setQuery('');
                            inputRef.current?.focus();
                        }}
                    >
                        ✕
                    </button>
                )}
            </div>

            {isOpen && filtered.length > 0 && (
                <div className="region-search-dropdown">
                    {filtered.map((region, idx) => (
                        <button
                            key={region.id}
                            className={`region-search-item ${idx === activeIndex ? 'active' : ''}`}
                            onClick={() => handleSelect(region)}
                            onMouseEnter={() => setActiveIndex(idx)}
                        >
                            <span className="region-search-item-name">{region.name}</span>
                            <span className="region-search-item-code">{region.state}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
