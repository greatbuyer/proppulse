'use client';

import React, { useState } from 'react';

export default function Footer() {
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    return (
        <>
            <footer className="footer">
                <div className="footer-links">
                    <a href="#" onClick={(e) => { e.preventDefault(); setShowDisclaimer(true); }}>Disclaimer</a>
                    <a href="#">About</a>
                    <a href="#">Methodology</a>
                    <a href="#">API</a>
                    <a href="#">Privacy</a>
                    <a href="#">Terms</a>
                </div>
                <p className="footer-disclaimer-brief">
                    ⚠️ Not financial advice. See full <button className="footer-disclaimer-link" onClick={() => setShowDisclaimer(true)}>disclaimer</button>.
                </p>
                <p>
                    © 2026 PropPulse. Data sourced from Zillow Research, FRED, and public records.
                    <br />
                    Built with Next.js · Hosted on Vercel · Powered by Supabase
                </p>
            </footer>

            {showDisclaimer && (
                <div className="modal-overlay" onClick={() => setShowDisclaimer(false)}>
                    <div className="modal-container animate-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <button className="modal-close" onClick={() => setShowDisclaimer(false)}>✕</button>
                        <div style={{ padding: 'var(--space-md) 0' }}>
                            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-md)', textAlign: 'center' }}>⚖️</div>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 'var(--space-lg)', textAlign: 'center' }}>
                                Disclaimer
                            </h2>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.8 }}>
                                <p style={{ marginBottom: 'var(--space-md)' }}>
                                    <strong style={{ color: 'var(--text-primary)' }}>Not Financial or Investment Advice.</strong>{' '}
                                    The information provided on PropPulse is for general informational and educational purposes only.
                                    It does not constitute financial advice, investment advice, real estate advice, tax advice,
                                    or any other form of professional advice.
                                </p>
                                <p style={{ marginBottom: 'var(--space-md)' }}>
                                    <strong style={{ color: 'var(--text-primary)' }}>Not a Licensed Agent or Broker.</strong>{' '}
                                    PropPulse is not a licensed real estate agent, broker, appraiser, or financial advisor.
                                    We do not buy, sell, or lease properties, nor do we facilitate real estate transactions.
                                </p>
                                <p style={{ marginBottom: 'var(--space-md)' }}>
                                    <strong style={{ color: 'var(--text-primary)' }}>No Guarantees of Accuracy.</strong>{' '}
                                    While we strive to present accurate and up-to-date data, we make no representations or warranties
                                    of any kind, express or implied, about the completeness, accuracy, reliability, or suitability of
                                    the information displayed. Real estate markets are inherently volatile, and past performance is not
                                    indicative of future results.
                                </p>
                                <p style={{ marginBottom: 'var(--space-md)' }}>
                                    <strong style={{ color: 'var(--text-primary)' }}>Use at Your Own Risk.</strong>{' '}
                                    Any reliance you place on the information provided by PropPulse is strictly at your own risk.
                                    You should always conduct your own research and consult with qualified professionals — including
                                    licensed real estate agents, financial advisors, and attorneys — before making any investment
                                    or real estate decisions.
                                </p>
                                <p style={{ marginBottom: 'var(--space-md)' }}>
                                    <strong style={{ color: 'var(--text-primary)' }}>Third-Party Data.</strong>{' '}
                                    Data displayed on this platform is sourced from third-party providers including Zillow Research,
                                    FRED (Federal Reserve Economic Data), and various public records. PropPulse is not responsible
                                    for the accuracy of third-party data sources.
                                </p>
                                <p>
                                    By using PropPulse, you acknowledge and agree that you have read, understood, and accepted
                                    this disclaimer in its entirety.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDisclaimer(false)}
                                style={{
                                    marginTop: 'var(--space-xl)',
                                    width: '100%',
                                    padding: '12px',
                                    background: 'var(--gradient-accent)',
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    fontFamily: 'inherit',
                                    cursor: 'pointer',
                                }}
                            >
                                I Understand
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
