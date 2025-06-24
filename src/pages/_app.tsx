import '@/styles/globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from 'next-themes';
import { ConvexProvider } from 'convex/react';
import { convex } from '@/lib/convex';
import type { AppProps } from 'next/app';

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
