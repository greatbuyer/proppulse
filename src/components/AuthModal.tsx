'use client';

import React, { useState } from 'react';
import { signUp, signIn } from '@/lib/auth';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (mode === 'signup') {
                await signUp(email, password);
                setSuccess('Account created! Check your email to confirm, then sign in.');
                setMode('login');
            } else {
                await signIn(email, password);
                onSuccess();
                onClose();
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container animate-in" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✕</button>

                <div className="modal-header">
                    <div className="modal-logo">P</div>
                    <h2 className="modal-title">
                        {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="modal-subtitle">
                        {mode === 'login'
                            ? 'Sign in to save markets and set price alerts'
                            : 'Join PropPulse to track your favorite markets'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {error && (
                        <div className="modal-alert error">
                            <span>⚠️</span> {error}
                        </div>
                    )}
                    {success && (
                        <div className="modal-alert success">
                            <span>✅</span> {success}
                        </div>
                    )}

                    <div className="modal-field">
                        <label className="modal-label">Email</label>
                        <input
                            type="email"
                            className="modal-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="modal-field">
                        <label className="modal-label">Password</label>
                        <input
                            type="password"
                            className="modal-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'}
                            required
                            minLength={6}
                            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        />
                    </div>

                    <button type="submit" className="modal-submit" disabled={loading}>
                        {loading
                            ? '⏳ Please wait...'
                            : mode === 'login'
                                ? '🔐 Sign In'
                                : '🚀 Create Account'}
                    </button>
                </form>

                <div className="modal-footer">
                    {mode === 'login' ? (
                        <p>
                            Don&apos;t have an account?{' '}
                            <button className="modal-switch" onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}>
                                Sign up
                            </button>
                        </p>
                    ) : (
                        <p>
                            Already have an account?{' '}
                            <button className="modal-switch" onClick={() => { setMode('login'); setError(''); setSuccess(''); }}>
                                Sign in
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
