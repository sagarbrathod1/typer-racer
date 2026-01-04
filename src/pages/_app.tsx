import '@/styles/globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from 'next-themes';
import { ConvexProvider } from 'convex/react';
import { convex } from '@/lib/convex';
import type { AppProps, NextWebVitalsMetric } from 'next/app';

export function reportWebVitals(metric: NextWebVitalsMetric) {
    const { id, name, value } = metric;
    const rating = (metric as NextWebVitalsMetric & { rating?: string }).rating;

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Web Vitals] ${name}: ${value.toFixed(2)}${rating ? ` (${rating})` : ''}`);
    }

    // Send to analytics endpoint if available
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', name, {
            event_category: 'Web Vitals',
            event_label: id,
            value: Math.round(name === 'CLS' ? value * 1000 : value),
            non_interaction: true,
        });
    }
}

export default function App({ Component, pageProps }: AppProps) {
    return (
        <ClerkProvider {...pageProps}>
            <ConvexProvider client={convex}>
                <ThemeProvider defaultTheme="light" attribute="class" enableSystem={false}>
                    <Component {...pageProps} />
                </ThemeProvider>
            </ConvexProvider>
        </ClerkProvider>
    );
}
