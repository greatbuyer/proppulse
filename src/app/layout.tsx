import type { Metadata, Viewport } from 'next';
import './globals.css';


export const metadata: Metadata = {
    title: 'PropPulse | US Real Estate Trends & Analytics',
    description:
        'Track US real estate market trends with interactive heatmaps, pricing analytics, and market comparisons across residential and commercial properties. Powered by live data.',
    keywords: [
        'real estate analytics',
        'US housing market',
        'property trends',
        'home prices',
        'real estate heatmap',
        'market comparison',
        'residential property',
        'commercial real estate',
        'PropPulse',
    ],
    authors: [{ name: 'PropPulse' }],
    creator: 'PropPulse',
    publisher: 'PropPulse',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        siteName: 'PropPulse',
        title: 'PropPulse | US Real Estate Trends & Analytics',
        description:
            'Interactive analytics dashboard for tracking US real estate market trends, pricing data, and investment opportunities.',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'PropPulse — US Real Estate Analytics Dashboard',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'PropPulse | US Real Estate Trends & Analytics',
        description:
            'Interactive analytics dashboard for tracking US real estate market trends.',
        images: ['/og-image.png'],
    },
    icons: {
        icon: [
            { url: '/favicon.svg', type: 'image/svg+xml' },
        ],
        apple: '/favicon.svg',
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#FFD166',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
                <link rel="canonical" href="https://berrypickle.com" />
            </head>
            <body>
                <div id="app-root">{children}</div>
            </body>
        </html>
    );
}
