import { AngelIcon, DevilIcon } from '@/assets/images';
import ToggleButton from '@/components/ToggleButton/ToggleButton';
import TypingLoader from '@/components/TypingLoader';
import { useTheme } from 'next-themes';
import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import TypingBoard from './components/TypingBoard';
import useDatabaseInfo from '../hooks/useDatabaseInfo';
import useKeyPress from '../hooks/useKeyPress';
import { useIsSm } from '../hooks/useMediaQuery';
import Results from './components/Results';
import useLeaderboardDatabaseInfo from '@/hooks/useLeaderboardDatabaseInfo';
import { useUser } from '@clerk/nextjs';
import { createPortal } from 'react-dom';

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
    <span className="text-gray-400">
      {Array(16).fill(' ').join('').slice(-30)}
    </span>
    Loading corpus...
  </p>
);

const TypingInstructions = ({ startTime }: { startTime: number }) => (
  <div className={'flex-col justify-center mb-4 ' + (startTime && 'hidden-animate')}>
    <span>^</span>
    <p>Start typing</p>
  </div>
);

const ResetButton = ({ startTime, resetState }: { startTime: number; resetState: () => void }) => (
  <button
    onClick={resetState}
    disabled={!startTime}
    className="block mx-auto mb-4 p-1 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:cursor-not-allowed"
    aria-label="Reset race"
    type="button"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={'h-5 w-5 ' + (!startTime && 'text-gray-400')}
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
        <button
            onClick={resetState}
            className="border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 py-1.5 px-3 rounded-sm transition-colors"
        >
            Try again?
        </button> as any,
        tryAgainSlot
    );
};

export default function TyperRacer() {
    const isSm = useIsSm();
    const [wpm, setWpm] = useState<number>(0);
    const [seconds, setTime] = useState<number>(30);
    const [leftPadding, setLeftPadding] = useState(new Array(isSm ? 25 : 30).fill(' ').join('')); // initial 50 spaces to keep current char at center
    const [outgoingChars, setOutgoingChars] = useState<string>(''); // characters just typed
    const [incorrectChar, setIncorrectChar] = useState<boolean>(false);
    const [corpus, setCorpus] = useState<string>('');
    const [currentChar, setCurrentChar] = useState<string>(corpus.charAt(0));
    const [incomingChars, setIncomingChars] = useState(corpus.substr(1)); // next chars to type
    const [startTime, setStartTime] = useState<number>(0);
    const [wordCount, setWordCount] = useState<number>(0);
    const [charCount, setCharCount] = useState<number>(0);
    const [wpmArray, setWpmArray] = useState<number[]>([]);
    const [errorCount, setErrorCount] = useState<number>(0);
    const { isSignedIn, isLoaded } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const [skipMode, setSkipMode] = useState<boolean>(false);
    const [pendingScore, setPendingScore] = useState<number | null>(null);
    const isGuest = !isSignedIn;

    const { words, sagarWpm, loading: loadingCorpusData } = useDatabaseInfo();
    const {
        loading: loadingLeaderboardData,
        saveScore,
        getLeaderboard,
    } = useLeaderboardDatabaseInfo();

    // Check for pending score after sign-in
    useEffect(() => {
        if (isLoaded) {
            setIsLoading(false);

            // Check if there's a pending score to submit after sign-in
            if (isSignedIn && typeof window !== 'undefined') {
                const stored = sessionStorage.getItem(PENDING_SCORE_KEY);
                if (stored) {
                    const score = JSON.parse(stored);
                    setPendingScore(score.wpm);
                    setWpm(score.wpm);
                    setWpmArray(score.wpmArray || []);
                    setErrorCount(score.errorCount || 0);
                    setTime(0); // Show results
                    sessionStorage.removeItem(PENDING_SCORE_KEY);
                }
            }
        }
    }, [isLoaded, isSignedIn]);

    // Auto-submit pending score once authenticated
    useEffect(() => {
        if (pendingScore && isSignedIn && !loadingLeaderboardData) {
            saveScore(pendingScore, () => {
                setPendingScore(null);
            });
        }
    }, [pendingScore, isSignedIn, loadingLeaderboardData, saveScore]);

    const leaderboard = useMemo(() => getLeaderboard(), [getLeaderboard]);

    const { theme } = useTheme();

    const tabIcon: string = useMemo(
        () => (theme === 'light' ? AngelIcon.src : DevilIcon.src),
        [theme]
    );

    const currentTime = useCallback(() => {
        return new Date().getTime();
    }, []);

    useEffect(() => {
        if (words && words.trim() !== '') {
            setCorpus(words);
            setCurrentChar(words.charAt(0));
            setIncomingChars(words.substr(1));
        }
    }, [words]);

    useEffect(() => {
        const timeoutId =
            seconds > 0 && startTime
                ? setTimeout(() => {
                      setTime(seconds - 1);
                      const durationInMinutes = (currentTime() - startTime) / 60000.0;
                      const newWpm = Number((charCount / 5 / durationInMinutes).toFixed(2));
                      setWpm(newWpm);
                      const newWpmArray = wpmArray;
                      newWpmArray.push(newWpm);
                      setWpmArray(newWpmArray);
                  }, 1000)
                : undefined;

        return () => {
            clearTimeout(timeoutId);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seconds, startTime]);

    useKeyPress({
        callback: (key) => {
            if (skipMode) {
                return;
            }
            
            if (!startTime) {
                setStartTime(currentTime);
            }

            if (seconds === 0 || loadingCorpusData) {
                return;
            }

            let updatedOutgoingChars = outgoingChars;
            let updatedIncomingChars = incomingChars;

            if (key === currentChar) {
                setIncorrectChar(false);
                if (leftPadding.length > 0) {
                    setLeftPadding(leftPadding.substring(1));
                }

                updatedOutgoingChars += currentChar;
                setOutgoingChars(updatedOutgoingChars);

                setCurrentChar(incomingChars.charAt(0));

                updatedIncomingChars = incomingChars.substring(1);

                setIncomingChars(updatedIncomingChars);

                setCharCount(charCount + 1);

                if (incomingChars.charAt(0) === ' ') {
                    setWordCount(wordCount + 1);
                }
            } else {
                setIncorrectChar(true);
                setErrorCount(errorCount + 1);
            }
        },
    });

    const resetState = useCallback(() => {
        setLeftPadding(new Array(isSm ? 25 : 30).fill(' ').join(''));
        setOutgoingChars('');
        setCurrentChar(corpus.charAt(0));
        setIncomingChars(corpus.substr(1));
        setStartTime(0);
        setWordCount(0);
        setCharCount(0);
        setWpm(0);
        setTime(30);
        setWpmArray([]);
        setIncorrectChar(false);
        setSkipMode(false);
    }, [corpus, isSm]);

    const skipToResults = useCallback(() => {
        setSkipMode(true);
        setTime(0);
        setWpm(0);
        setWpmArray([]);
    }, []);

    if (isLoading) {
        return <TypingLoader message="Clean your keyboard..." letters={['R', 'A', 'C', 'E', ' ', 'M', 'E']} />;
    }

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
                            <TypingStats wpm={wpm} seconds={seconds} />
                        </div>
                        {loadingCorpusData ? (
                            <LoadingCorpus />
                        ) : (
                            <TypingBoard
                                currentChar={currentChar}
                                incomingChars={incomingChars}
                                incorrectChar={incorrectChar}
                                isSm={isSm}
                                leftPadding={leftPadding}
                                outgoingChars={outgoingChars}
                            />
                        )}
                        <div className="h-2 relative">
                            {seconds !== 0 && !skipMode && (
                                <>
                                    <TypingInstructions startTime={startTime} />
                                    <ResetButton startTime={startTime} resetState={resetState} />
                                </>
                            )}
                            {seconds === 30 && !startTime && (
                                <LeaderboardButton onClick={skipToResults} />
                            )}
                        </div>
                        {seconds === 0 && (
                            <Results
                                sagarWpm={sagarWpm}
                                wpm={wpm}
                                wpmArray={wpmArray}
                                corpus={corpus}
                                errorCount={errorCount}
                                leaderboard={leaderboard}
                                postLeaderboard={saveScore}
                                submitLeaderboardLoading={loadingLeaderboardData}
                                theme={theme}
                                skipMode={skipMode}
                                isGuest={isGuest}
                            />
                        )}
                        {seconds == 0 && !skipMode && <TryAgainButton resetState={resetState} />}
                        <div className="h-12 flex items-center justify-center mt-2">
                            {seconds == 0 && skipMode && (
                                <button
                                    onClick={resetState}
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

