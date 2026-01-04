import Head from 'next/head';
import { useTheme } from 'next-themes';
import ToggleButton from '@/components/ToggleButton/ToggleButton';
import { SignInButton, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { AngelIcon, DevilIcon } from '@/assets/images';
import TypingLoader from '@/components/TypingLoader';

const TypingHero = () => {
    const [text, setText] = useState('');
    const fullText = 'Think you can beat me?';

    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            if (index <= fullText.length) {
                setText(fullText.slice(0, index));
                index++;
            } else {
                clearInterval(interval);
            }
        }, 80);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-8 mb-6">
            <span className="text-2xl font-mono">
                {text}
                <span className="animate-pulse">|</span>
            </span>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
    <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
        <div className="text-3xl mb-3">{icon}</div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
    </div>
);

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
        return (
            <TypingLoader
                message="Loading Typer Racer..."
                letters={['R', 'A', 'C', 'E', ' ', 'M', 'E']}
            />
        );
    }

    return (
        <>
            <Head>
                <title>Typer Racer - Test Your Typing Speed</title>
                <meta name="description" content="Think you can type faster than me? Race against my score, challenge friends in real-time multiplayer, and climb the global leaderboard." />
                <link rel="icon" href={theme === 'light' ? AngelIcon.src : DevilIcon.src} />
            </Head>
            <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                <ToggleButton />

                {/* Hero Section */}
                <main className="container mx-auto px-4 pt-20 pb-16">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-5xl sm:text-7xl font-bold mb-6 tracking-tight">
                            Typer Racer
                        </h1>
                        <TypingHero />
                        <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
                            Race against me and see how your typing stacks up.
                            Or challenge your friends in real-time multiplayer.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
                            <button
                                onClick={() => router.push('/typer-racer')}
                                className="bg-black dark:bg-white text-white dark:text-black font-semibold py-4 px-8 rounded-full hover:opacity-80 transition-opacity text-lg"
                            >
                                Race Me
                            </button>
                            <SignInButton mode="modal" redirectUrl="/typer-racer">
                                <button className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-4 px-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-lg">
                                    Sign In for Leaderboard
                                </button>
                            </SignInButton>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                            <FeatureCard
                                icon={<span>⌨️</span>}
                                title="Race Me"
                                description="30 seconds to beat my score. Real-time WPM tracking and accuracy comparison."
                            />
                            <FeatureCard
                                icon={<span>🏁</span>}
                                title="Race Friends"
                                description="1v1 multiplayer with room codes. See their progress live as you type."
                            />
                            <FeatureCard
                                icon={<span>🏆</span>}
                                title="Leaderboard"
                                description="Compete for the top spot. Sign in to save your scores."
                            />
                            <FeatureCard
                                icon={<span>📊</span>}
                                title="Mistake Heatmap"
                                description="See which characters trip you up most and improve your weak spots."
                            />
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="py-8 text-center text-gray-500 dark:text-gray-500 text-sm">
                    <p>Built for speed. No tracking, no ads.</p>
                </footer>
            </div>
        </>
    );
}
