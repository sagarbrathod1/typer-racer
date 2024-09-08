import '@/styles/globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from 'next-themes';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
    return (
        <ClerkProvider {...pageProps}>
            <ThemeProvider defaultTheme="light" attribute="class" enableSystem={false}>
                <Component {...pageProps} />
            </ThemeProvider>
        </ClerkProvider>
    );
}
