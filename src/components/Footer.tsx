'use client';

import React from 'react';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-links">
                <a href="#">About</a>
                <a href="#">Methodology</a>
                <a href="#">API</a>
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
            </div>
            <p>
                © 2026 PropPulse. Data sourced from Zillow Research, FRED, and public records.
                <br />
                Built with Next.js · Hosted on Vercel · Powered by Supabase
            </p>
        </footer>
    );
}
