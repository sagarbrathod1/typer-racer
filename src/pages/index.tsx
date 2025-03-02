import Head from 'next/head';
import { useTheme } from 'next-themes';
import ToggleButton from '@/components/ToggleButton/ToggleButton';
import { SignInButton, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { AngelIcon, DevilIcon } from '@/assets/images';

export default function LandingPage() {
    const { theme } = useTheme();
    const { isSignedIn, isLoaded } = useUser();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isLoaded) {
            if (isSignedIn) {
                router.push('/typer-racer');
            } else {
                setIsLoading(false);
            }
        }
    }, [isSignedIn, isLoaded, router]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return (
        <>
            <Head>
                <title>Typer Racer</title>
                <link rel="icon" href={theme === 'light' ? AngelIcon.src : DevilIcon.src} />
            </Head>
            <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                <ToggleButton />
                <main className="container mx-auto px-4 py-16 flex flex-col items-center justify-center h-screen">
                    <div className="text-center mb-12">
                        <h1 className="text-6xl font-bold mb-4">Welcome to Typer Racer</h1>
                        <p className="text-xl mb-8">Test your typing skills against me!</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-12 rounded-lg max-w-md w-full mx-auto">
                        <p className="text-xl mb-8 text-center">Ready to race me?</p>
                        {isSignedIn ? (
                            <button
                                onClick={() => router.push('/typer-racer')}
                                className="w-full bg-black hover:bg-gray-800 text-white font-bold py-4 px-8 rounded-full transform hover:scale-105 text-lg"
                            >
                                Start Typing
                            </button>
                        ) : (
                            <SignInButton mode="modal" redirectUrl="/typer-racer">
                                <button className="w-full bg-black dark:bg-white hover:bg-gray-800 text-white dark:text-black font-bold py-4 px-8 rounded-full transform hover:scale-105 text-lg transition-colors ease-in-out fade-in">
                                    Sign In
                                </button>
                            </SignInButton>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
