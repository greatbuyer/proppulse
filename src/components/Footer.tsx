'use client';

import React, { useState } from 'react';

type ModalType = null | 'disclaimer' | 'about' | 'methodology' | 'api' | 'privacy' | 'terms';

const modalBtnStyle: React.CSSProperties = {
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
};

const sectionStyle: React.CSSProperties = {
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    lineHeight: 1.8,
};

const headingStyle: React.CSSProperties = {
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    fontWeight: 700,
    marginTop: 'var(--space-lg)',
    marginBottom: 'var(--space-sm)',
};

const paraStyle: React.CSSProperties = {
    marginBottom: 'var(--space-md)',
};

function ModalShell({ icon, title, onClose, children }: {
    icon: string;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-container animate-in"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto' }}
            >
                <button className="modal-close" onClick={onClose}>✕</button>
                <div style={{ padding: 'var(--space-md) 0' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 'var(--space-md)', textAlign: 'center' }}>{icon}</div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 'var(--space-lg)', textAlign: 'center' }}>
                        {title}
                    </h2>
                    <div style={sectionStyle}>{children}</div>
                    <button onClick={onClose} style={modalBtnStyle}>Close</button>
                </div>
            </div>
        </div>
    );
}

/* ==================================================================
   ABOUT MODAL
   ================================================================== */
function AboutModal({ onClose }: { onClose: () => void }) {
    return (
        <ModalShell icon="🏠" title="About PropPulse" onClose={onClose}>
            <p style={paraStyle}>
                <strong style={{ color: 'var(--text-primary)' }}>PropPulse</strong> is a comprehensive US real estate analytics
                platform that provides investors, homebuyers, and real estate professionals with interactive market data
                and trend analysis across residential and commercial properties.
            </p>

            <h3 style={headingStyle}>🎯 Our Mission</h3>
            <p style={paraStyle}>
                To democratize access to professional-grade real estate analytics. We believe that market data and pricing
                trends should be freely accessible to everyone — not locked behind expensive institutional subscriptions.
            </p>

            <h3 style={headingStyle}>📊 What We Offer</h3>
            <ul style={{ paddingLeft: '20px', marginBottom: 'var(--space-md)' }}>
                <li style={{ marginBottom: '6px' }}>Interactive US heatmaps with state-level pricing data</li>
                <li style={{ marginBottom: '6px' }}>Historical pricing trends spanning 7 years (2020–2026)</li>
                <li style={{ marginBottom: '6px' }}>Side-by-side market comparison tools</li>
                <li style={{ marginBottom: '6px' }}>Residential and commercial property analytics</li>
                <li style={{ marginBottom: '6px' }}>Exportable reports in CSV and PDF formats</li>
                <li style={{ marginBottom: '6px' }}>Personalized market tracking with price alerts</li>
            </ul>

            <h3 style={headingStyle}>🌎 Data Coverage</h3>
            <p style={paraStyle}>
                We currently track <strong style={{ color: 'var(--text-primary)' }}>all 50 US states + DC</strong> with
                data sourced from Zillow Research and FRED. Our coverage includes residential and commercial property
                analytics with monthly automated updates.
            </p>

            <h3 style={headingStyle}>🛠 Technology</h3>
            <p style={paraStyle}>
                PropPulse is built using modern web technologies including Next.js, React, Supabase (PostgreSQL),
                and Recharts for data visualization. Our platform is hosted on Vercel with enterprise-grade performance
                and reliability.
            </p>

            <h3 style={headingStyle}>📬 Contact</h3>
            <p style={paraStyle}>
                Have questions, feedback, or partnership inquiries? Reach out to us at{' '}
                <strong style={{ color: 'var(--accent-blue)' }}>contacts@berrypickle.com</strong>
            </p>
        </ModalShell>
    );
}

/* ==================================================================
   METHODOLOGY MODAL
   ================================================================== */
function MethodologyModal({ onClose }: { onClose: () => void }) {
    return (
        <ModalShell icon="📐" title="Methodology" onClose={onClose}>
            <p style={paraStyle}>
                Transparency is core to our platform. Here's how we source, process, and present real estate data on PropPulse.
            </p>

            <h3 style={headingStyle}>📥 Data Sources</h3>
            <p style={paraStyle}>We aggregate data from multiple authoritative sources:</p>
            <ul style={{ paddingLeft: '20px', marginBottom: 'var(--space-md)' }}>
                <li style={{ marginBottom: '6px' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Zillow Research</strong> — Zillow Home Value Index (ZHVI),
                    Zillow Observed Rent Index (ZORI), and inventory data
                </li>
                <li style={{ marginBottom: '6px' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>FRED (Federal Reserve Economic Data)</strong> — Median
                    sales prices, housing starts, mortgage rates, and economic indicators
                </li>
                <li style={{ marginBottom: '6px' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Public Records</strong> — State and county assessor
                    records, MLS aggregated data, and building permit data
                </li>
            </ul>

            <h3 style={headingStyle}>📊 Key Metrics Explained</h3>
            <p style={paraStyle}>
                <strong style={{ color: 'var(--text-primary)' }}>Median Home Price:</strong> The middle value of all
                residential property sale prices in a given state and time period. We use the median rather than
                the average to reduce the impact of extreme outliers (mansions or distressed sales).
            </p>
            <p style={paraStyle}>
                <strong style={{ color: 'var(--text-primary)' }}>Price Per Square Foot:</strong> Total sale price
                divided by the total living area square footage. This normalizes prices across different property sizes
                for more meaningful comparisons.
            </p>
            <p style={paraStyle}>
                <strong style={{ color: 'var(--text-primary)' }}>Year-over-Year (YoY) Growth:</strong> The percentage
                change in median price compared to the same period in the prior year. Calculated as:
                <code style={{ display: 'block', margin: '8px 0', padding: '6px 12px', background: 'var(--bg-primary)', borderRadius: '4px' }}>
                    YoY = ((Current Price − Prior Year Price) ÷ Prior Year Price) × 100
                </code>
            </p>
            <p style={paraStyle}>
                <strong style={{ color: 'var(--text-primary)' }}>Days on Market:</strong> The median number of days
                a property is listed before going under contract. Lower values indicate a hotter, seller-favoring market.
            </p>
            <p style={paraStyle}>
                <strong style={{ color: 'var(--text-primary)' }}>Active Inventory:</strong> The total number of active
                property listings at the end of the reporting period.
            </p>

            <h3 style={headingStyle}>🔄 Data Updates</h3>
            <p style={paraStyle}>
                Market data is updated on a monthly cadence. Historical data ranges from January 2020 to the present.
                All timestamps reflect the last day of the reporting month.
            </p>

            <h3 style={headingStyle}>⚠️ Limitations</h3>
            <p style={paraStyle}>
                Our data relies on third-party sources and may have a lag of up to 30 days. Some states may have
                incomplete data for certain time periods. Commercial property data has more limited coverage than
                residential. We are continuously working to improve data quality and coverage.
            </p>
        </ModalShell>
    );
}

/* ==================================================================
   API MODAL
   ================================================================== */
function ApiModal({ onClose }: { onClose: () => void }) {
    return (
        <ModalShell icon="⚡" title="API Access" onClose={onClose}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                <div style={{
                    display: 'inline-block',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    color: 'var(--accent-blue)',
                    padding: '6px 16px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                }}>
                    🚧 Coming Soon
                </div>
            </div>

            <p style={paraStyle}>
                We're building a RESTful API that will give developers and businesses programmatic access to PropPulse
                market data. Here's what's planned:
            </p>

            <h3 style={headingStyle}>📋 Planned Endpoints</h3>
            <div style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '16px', marginBottom: 'var(--space-md)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                <div style={{ marginBottom: '8px' }}><span style={{ color: 'var(--accent-green)' }}>GET</span> /api/v1/regions</div>
                <div style={{ marginBottom: '8px' }}><span style={{ color: 'var(--accent-green)' }}>GET</span> /api/v1/regions/:id/market-data</div>
                <div style={{ marginBottom: '8px' }}><span style={{ color: 'var(--accent-green)' }}>GET</span> /api/v1/trends?type=residential</div>
                <div style={{ marginBottom: '8px' }}><span style={{ color: 'var(--accent-green)' }}>GET</span> /api/v1/compare?a=CA&b=TX</div>
                <div><span style={{ color: 'var(--accent-green)' }}>GET</span> /api/v1/rankings?sort=yoy_growth</div>
            </div>

            <h3 style={headingStyle}>💎 Pricing Tiers (Planned)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: 'var(--space-md)' }}>
                <div style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Free</div>
                    <div style={{ fontSize: '0.75rem' }}>100 requests/day<br />State-level data<br />Monthly resolution</div>
                </div>
                <div style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '4px' }}>Pro</div>
                    <div style={{ fontSize: '0.75rem' }}>10,000 requests/day<br />City-level data<br />Weekly resolution</div>
                </div>
            </div>

            <h3 style={headingStyle}>📬 Get Notified</h3>
            <p style={paraStyle}>
                Want to be among the first to access the PropPulse API? Contact us at{' '}
                <strong style={{ color: 'var(--accent-blue)' }}>contacts@berrypickle.com</strong>{' '}
                and we'll notify you when it launches.
            </p>
        </ModalShell>
    );
}

/* ==================================================================
   PRIVACY POLICY MODAL
   ================================================================== */
function PrivacyModal({ onClose }: { onClose: () => void }) {
    return (
        <ModalShell icon="🔒" title="Privacy Policy" onClose={onClose}>
            <p style={{ ...paraStyle, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last updated: February 23, 2026</p>

            <p style={paraStyle}>
                PropPulse (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy and is committed to protecting
                your personal data. This policy explains how we collect, use, and safeguard your information.
            </p>

            <h3 style={headingStyle}>1. Information We Collect</h3>
            <p style={paraStyle}>
                <strong style={{ color: 'var(--text-primary)' }}>Account Information:</strong> When you create an account,
                we collect your email address and an encrypted password. We do not store passwords in plain text.
            </p>
            <p style={paraStyle}>
                <strong style={{ color: 'var(--text-primary)' }}>Usage Data:</strong> We collect anonymized information about
                how you interact with the platform, including pages visited, search queries, and features used.
            </p>
            <p style={paraStyle}>
                <strong style={{ color: 'var(--text-primary)' }}>Saved Preferences:</strong> If you save markets or set alerts,
                we store these preferences linked to your account.
            </p>

            <h3 style={headingStyle}>2. How We Use Your Information</h3>
            <ul style={{ paddingLeft: '20px', marginBottom: 'var(--space-md)' }}>
                <li style={{ marginBottom: '6px' }}>To provide and maintain the PropPulse service</li>
                <li style={{ marginBottom: '6px' }}>To send you price alerts you've opted into</li>
                <li style={{ marginBottom: '6px' }}>To improve our platform based on usage patterns</li>
                <li style={{ marginBottom: '6px' }}>To respond to support requests and inquiries</li>
            </ul>

            <h3 style={headingStyle}>3. Data Sharing</h3>
            <p style={paraStyle}>
                We do <strong style={{ color: 'var(--text-primary)' }}>not</strong> sell, trade, or rent your personal
                information to third parties. We may share anonymized, aggregated data for analytics purposes.
            </p>

            <h3 style={headingStyle}>4. Data Storage & Security</h3>
            <p style={paraStyle}>
                Your data is stored securely on Supabase (PostgreSQL) with encrypted connections (TLS/SSL).
                Authentication is handled through Supabase Auth with industry-standard security practices
                including bcrypt password hashing and JWT session tokens.
            </p>

            <h3 style={headingStyle}>5. Cookies</h3>
            <p style={paraStyle}>
                We use essential cookies for authentication session management. We do not use third-party
                tracking cookies or advertising cookies.
            </p>

            <h3 style={headingStyle}>6. Your Rights</h3>
            <p style={paraStyle}>
                You may request to access, update, or delete your personal data at any time by contacting us at{' '}
                <strong style={{ color: 'var(--accent-blue)' }}>contacts@berrypickle.com</strong>. You can delete your
                account and all associated data by contacting our support team.
            </p>

            <h3 style={headingStyle}>7. Changes to This Policy</h3>
            <p style={paraStyle}>
                We may update this privacy policy from time to time. We will notify registered users of significant
                changes via email. Continued use of the platform constitutes acceptance of the updated policy.
            </p>
        </ModalShell>
    );
}

/* ==================================================================
   TERMS OF SERVICE MODAL
   ================================================================== */
function TermsModal({ onClose }: { onClose: () => void }) {
    return (
        <ModalShell icon="📜" title="Terms of Service" onClose={onClose}>
            <p style={{ ...paraStyle, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last updated: February 23, 2026</p>

            <p style={paraStyle}>
                By accessing or using PropPulse (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
                If you do not agree, please do not use the Service.
            </p>

            <h3 style={headingStyle}>1. Acceptance of Terms</h3>
            <p style={paraStyle}>
                By using PropPulse, you confirm that you are at least 18 years old and agree to comply with these
                terms, our Privacy Policy, and our Disclaimer.
            </p>

            <h3 style={headingStyle}>2. Use of the Service</h3>
            <p style={paraStyle}>PropPulse grants you a limited, non-exclusive, non-transferable license to access
                and use the platform for personal, non-commercial purposes. You agree not to:</p>
            <ul style={{ paddingLeft: '20px', marginBottom: 'var(--space-md)' }}>
                <li style={{ marginBottom: '6px' }}>Scrape, crawl, or programmatically extract data without authorization</li>
                <li style={{ marginBottom: '6px' }}>Redistribute or resell PropPulse data or reports</li>
                <li style={{ marginBottom: '6px' }}>Attempt to gain unauthorized access to our systems</li>
                <li style={{ marginBottom: '6px' }}>Use the platform for any unlawful purpose</li>
                <li style={{ marginBottom: '6px' }}>Interfere with the proper functioning of the Service</li>
            </ul>

            <h3 style={headingStyle}>3. Account Responsibilities</h3>
            <p style={paraStyle}>
                You are responsible for maintaining the confidentiality of your account credentials and for all
                activities that occur under your account. You must notify us immediately of any unauthorized use.
            </p>

            <h3 style={headingStyle}>4. Intellectual Property</h3>
            <p style={paraStyle}>
                All content, design, code, and data on PropPulse is the property of PropPulse or its licensors.
                You may not copy, modify, or distribute any content without prior written permission, except for
                data exported through our built-in export features for personal use.
            </p>

            <h3 style={headingStyle}>5. Limitation of Liability</h3>
            <p style={paraStyle}>
                PropPulse is provided &quot;as is&quot; without warranties of any kind. To the maximum extent permitted
                by law, PropPulse shall not be liable for any indirect, incidental, special, consequential, or punitive
                damages arising from your use of the Service, including but not limited to financial losses based on
                data presented on the platform.
            </p>

            <h3 style={headingStyle}>6. Termination</h3>
            <p style={paraStyle}>
                We reserve the right to suspend or terminate your access to PropPulse at any time for violation
                of these terms or for any other reason at our sole discretion.
            </p>

            <h3 style={headingStyle}>7. Governing Law</h3>
            <p style={paraStyle}>
                These terms shall be governed by and construed in accordance with the laws of the United States.
                Any disputes shall be resolved in the courts of competent jurisdiction.
            </p>

            <h3 style={headingStyle}>8. Contact</h3>
            <p style={paraStyle}>
                For questions about these Terms of Service, contact us at{' '}
                <strong style={{ color: 'var(--accent-blue)' }}>contacts@berrypickle.com</strong>
            </p>
        </ModalShell>
    );
}

/* ==================================================================
   DISCLAIMER MODAL
   ================================================================== */
function DisclaimerModal({ onClose }: { onClose: () => void }) {
    return (
        <ModalShell icon="⚖️" title="Disclaimer" onClose={onClose}>
            <p style={paraStyle}>
                <strong style={{ color: 'var(--text-primary)' }}>Not Financial or Investment Advice.</strong>{' '}
                The information provided on PropPulse is for general informational and educational purposes only.
                It does not constitute financial advice, investment advice, real estate advice, tax advice,
                or any other form of professional advice.
            </p>
            <p style={paraStyle}>
                <strong style={{ color: 'var(--text-primary)' }}>Not a Licensed Agent or Broker.</strong>{' '}
                PropPulse is not a licensed real estate agent, broker, appraiser, or financial advisor.
                We do not buy, sell, or lease properties, nor do we facilitate real estate transactions.
            </p>
            <p style={paraStyle}>
                <strong style={{ color: 'var(--text-primary)' }}>No Guarantees of Accuracy.</strong>{' '}
                While we strive to present accurate and up-to-date data, we make no representations or warranties
                of any kind, express or implied, about the completeness, accuracy, reliability, or suitability of
                the information displayed. Real estate markets are inherently volatile, and past performance is not
                indicative of future results.
            </p>
            <p style={paraStyle}>
                <strong style={{ color: 'var(--text-primary)' }}>Use at Your Own Risk.</strong>{' '}
                Any reliance you place on the information provided by PropPulse is strictly at your own risk.
                You should always conduct your own research and consult with qualified professionals — including
                licensed real estate agents, financial advisors, and attorneys — before making any investment
                or real estate decisions.
            </p>
            <p style={paraStyle}>
                <strong style={{ color: 'var(--text-primary)' }}>Third-Party Data.</strong>{' '}
                Data displayed on this platform is sourced from third-party providers including Zillow Research,
                FRED (Federal Reserve Economic Data), and various public records. PropPulse is not responsible
                for the accuracy of third-party data sources.
            </p>
            <p style={paraStyle}>
                By using PropPulse, you acknowledge and agree that you have read, understood, and accepted
                this disclaimer in its entirety.
            </p>
        </ModalShell>
    );
}

/* ==================================================================
   FOOTER COMPONENT
   ================================================================== */
export default function Footer() {
    const [activeModal, setActiveModal] = useState<ModalType>(null);

    const openModal = (modal: ModalType) => (e: React.MouseEvent) => {
        e.preventDefault();
        setActiveModal(modal);
    };

    return (
        <>
            <footer className="footer">
                <div className="footer-links">
                    <a href="#" onClick={openModal('disclaimer')}>Disclaimer</a>
                    <a href="#" onClick={openModal('about')}>About</a>
                    <a href="#" onClick={openModal('methodology')}>Methodology</a>
                    <a href="#" onClick={openModal('api')}>API</a>
                    <a href="#" onClick={openModal('privacy')}>Privacy</a>
                    <a href="#" onClick={openModal('terms')}>Terms</a>
                </div>
                <p className="footer-disclaimer-brief">
                    ⚠️ Not financial advice. See full <button className="footer-disclaimer-link" onClick={() => setActiveModal('disclaimer')}>disclaimer</button>.
                </p>
                <p>
                    © 2026 PropPulse. Data sourced from Zillow Research, FRED, and public records.
                    <br />
                    Built with Next.js · Hosted on Vercel · Powered by Supabase
                </p>
            </footer>

            {activeModal === 'disclaimer' && <DisclaimerModal onClose={() => setActiveModal(null)} />}
            {activeModal === 'about' && <AboutModal onClose={() => setActiveModal(null)} />}
            {activeModal === 'methodology' && <MethodologyModal onClose={() => setActiveModal(null)} />}
            {activeModal === 'api' && <ApiModal onClose={() => setActiveModal(null)} />}
            {activeModal === 'privacy' && <PrivacyModal onClose={() => setActiveModal(null)} />}
            {activeModal === 'terms' && <TermsModal onClose={() => setActiveModal(null)} />}
        </>
    );
}
