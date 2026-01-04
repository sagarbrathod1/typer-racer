import { AngelIcon, DevilIcon } from '@/assets/images';
import ToggleButton from '@/components/ToggleButton/ToggleButton';
import TypingLoader from '@/components/TypingLoader';
import { useTheme } from 'next-themes';
import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import TypingBoard from './components/TypingBoard';
import useDatabaseInfo from '../hooks/useDatabaseInfo';
import useTypingGame from '../hooks/useTypingGame';
import { useIsSm } from '../hooks/useMediaQuery';
import Results from './components/Results';
import useLeaderboardDatabaseInfo from '@/hooks/useLeaderboardDatabaseInfo';
import { useUser } from '@clerk/nextjs';
import { createPortal } from 'react-dom';
import { GameResult } from '@/types/models';

const PENDING_SCORE_KEY = 'typer-racer-pending-score';

const TypingStats = ({ wpm, seconds }: { wpm: number; seconds: number }) => (
    <div>
        <h3 className="text-center sm:text-left">WPM: {wpm}</h3>
        <h3 className="text-center sm:text-left">Time: {seconds}</h3>
    </div>
);

const LoadingCorpus = () => (
    <p className="whitespace-pre width-race-me-text">
        {' '}
        <span className="text-gray-400">{Array(16).fill(' ').join('').slice(-30)}</span>
        Loading corpus...
    </p>
);

const TypingInstructions = ({ visible }: { visible: boolean }) => (
    <div className={'flex-col justify-center mb-4 ' + (!visible && 'hidden-animate')}>
        <span>^</span>
        <p>Start typing</p>
    </div>
);

const ResetButton = ({ enabled, resetState }: { enabled: boolean; resetState: () => void }) => (
    <button
        onClick={resetState}
        disabled={!enabled}
        className="block mx-auto mb-4 p-1 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:cursor-not-allowed"
        aria-label="Reset race"
        type="button"
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={'h-5 w-5 ' + (!enabled && 'text-gray-400')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
        </svg>
    </button>
);

const LeaderboardButton = ({ onClick }: { onClick: () => void }) => (
    <button
        onClick={onClick}
        className="mb-4 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 py-1 px-3 rounded-sm transition-colors"
    >
        View Leaderboard
    </button>
);

const TryAgainButton = ({ resetState }: { resetState: () => void }): JSX.Element | null => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    const tryAgainSlot = document.getElementById('try-again-button-slot');
    if (!tryAgainSlot) return null;

    return createPortal(
        (
            <button
                onClick={resetState}
                className="border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 py-1.5 px-3 rounded-sm transition-colors"
            >
                Try again?
            </button>
        ) as any,
        tryAgainSlot
    );
};

export default function TyperRacer() {
    const isSm = useIsSm();
    const { user, isSignedIn, isLoaded } = useUser();
    const [isLoading, setIsLoading] = useState(true);

    const { words, sagarWpm, loading: loadingCorpusData } = useDatabaseInfo();
    const {
        loading: loadingLeaderboardData,
        saveScore,
        getLeaderboard,
    } = useLeaderboardDatabaseInfo();

    const game = useTypingGame({
        corpus: words || '',
        isSm,
        disabled: loadingCorpusData,
    });

    // Check for pending score after sign-in
    useEffect(() => {
        if (isLoaded) {
            setIsLoading(false);

            if (isSignedIn && typeof window !== 'undefined') {
                const stored = sessionStorage.getItem(PENDING_SCORE_KEY);
                if (stored) {
                    const score = JSON.parse(stored);
                    game.setWpm(score.wpm);
                    game.setWpmArray(score.wpmArray || []);
                    game.setErrorCount(score.errorCount || 0);
                    game.setTime(0);
                    sessionStorage.removeItem(PENDING_SCORE_KEY);
                }
            }
        }
    }, [isLoaded, isSignedIn]);

    const leaderboard = useMemo(() => getLeaderboard(), [getLeaderboard]);

    const { theme } = useTheme();
    const tabIcon: string = useMemo(
        () => (theme === 'light' ? AngelIcon.src : DevilIcon.src),
        [theme]
    );

    const isGuest = !isSignedIn;

    const gameResult: GameResult | null = useMemo(() => {
        if (!game.startTime || !game.endTime || game.skipMode) return null;
        return {
            startTime: game.startTime,
            endTime: game.endTime,
            charsTyped: game.charCount,
            corpusLength: (words || '').length,
        };
    }, [game.startTime, game.endTime, game.charCount, words, game.skipMode]);

    if (isLoading) {
        return (
            <TypingLoader
                message="Clean your keyboard..."
                letters={['R', 'A', 'C', 'E', ' ', 'M', 'E']}
            />
        );
    }

    const showGameControls = !game.isGameOver && !game.skipMode;
    const showLeaderboardButton = game.seconds === 30 && !game.isGameStarted;

    return (
        <>
            <Head>
                <title>Typer Racer</title>
                <link rel="icon" href={tabIcon} />
            </Head>
            <>
                <ToggleButton />
                <main className="flex items-center justify-center relative min-h-screen pt-8">
                    <div className="font-mono text-center max-w-3xl w-full px-4 mx-auto">
                        <div className="mb-4">
                            <TypingStats wpm={game.wpm} seconds={game.seconds} />
                        </div>
                        {loadingCorpusData ? (
                            <LoadingCorpus />
                        ) : (
                            <TypingBoard
                                currentChar={game.currentChar}
                                incomingChars={game.incomingChars}
                                incorrectChar={game.incorrectChar}
                                isSm={isSm}
                                leftPadding={game.leftPadding}
                                outgoingChars={game.outgoingChars}
                            />
                        )}
                        <div className="h-2 relative">
                            {showGameControls && (
                                <>
                                    <TypingInstructions visible={!game.isGameStarted} />
                                    <ResetButton
                                        enabled={game.isGameStarted}
                                        resetState={game.resetState}
                                    />
                                </>
                            )}
                            {showLeaderboardButton && (
                                <LeaderboardButton onClick={game.skipToResults} />
                            )}
                        </div>
                        {game.isGameOver && (
                            <Results
                                sagarWpm={sagarWpm}
                                wpm={game.wpm}
                                wpmArray={game.wpmArray}
                                corpus={words || ''}
                                errorCount={game.errorCount}
                                errorMap={game.errorMap}
                                leaderboard={leaderboard}
                                postLeaderboard={saveScore}
                                submitLeaderboardLoading={loadingLeaderboardData}
                                theme={theme}
                                skipMode={game.skipMode}
                                isGuest={isGuest}
                                gameResult={gameResult}
                                userId={user?.id}
                                username={user?.username ?? user?.firstName ?? undefined}
                            />
                        )}
                        {game.isGameOver && !game.skipMode && (
                            <TryAgainButton resetState={game.resetState} />
                        )}
                        <div className="h-12 flex items-center justify-center mt-2">
                            {game.isGameOver && game.skipMode && (
                                <button
                                    onClick={game.resetState}
                                    className="border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 py-1.5 px-3 rounded-sm transition-colors"
                                >
                                    Race me!
                                </button>
                            )}
                        </div>
                    </div>
                </main>
            </>
        </>
    );
}
