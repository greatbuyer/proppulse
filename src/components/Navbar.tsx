'use client';

import React from 'react';
import { AuthUser } from '@/lib/auth';

interface NavbarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    user?: AuthUser | null;
    onSignInClick?: () => void;
    onSignOut?: () => void;
}

const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'residential', label: 'Residential' },
    { id: 'commercial', label: 'Commercial' },
    { id: 'compare', label: 'Compare' },
];

export default function Navbar({
    activeTab,
    onTabChange,
    user,
    onSignInClick,
    onSignOut,
}: NavbarProps) {
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <div className="navbar-logo">P</div>
                <div>
                    <div className="navbar-title">PropPulse</div>
                    <div className="navbar-subtitle">REAL ESTATE ANALYTICS</div>
                </div>
            </div>

            <div className="navbar-links">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`navbar-link ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => onTabChange(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="navbar-auth">
                {user ? (
                    <>
                        <div className="navbar-avatar">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="navbar-user-info">
                            <div className="navbar-user-email">{user.email}</div>
                        </div>
                        <button className="navbar-signout" onClick={onSignOut}>
                            Sign Out
                        </button>
                    </>
                ) : (
                    <button className="navbar-signin" onClick={onSignInClick}>
                        Sign In
                    </button>
                )}
            </div>
        </nav>
    );
}
