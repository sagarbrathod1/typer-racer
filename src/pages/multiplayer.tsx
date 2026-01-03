import { AngelIcon, DevilIcon } from '@/assets/images';
import ToggleButton from '@/components/ToggleButton/ToggleButton';
import TypingLoader from '@/components/TypingLoader';
import { useTheme } from 'next-themes';
import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GetServerSideProps } from 'next';
import { buildClerkProps, clerkClient, getAuth } from '@clerk/nextjs/server';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import MultiplayerLobby from './components/MultiplayerLobby';
import WaitingRoom from './components/WaitingRoom';
import RaceProgress from './components/RaceProgress';
import MultiplayerResults from './components/MultiplayerResults';
import TypingBoard from './components/TypingBoard';
import useKeyPress from '@/hooks/useKeyPress';
import { useIsSm } from '@/hooks/useMediaQuery';

type Props = {
    userInfo: {
        id: string;
        username: string | null;
        firstName?: string | null;
        emailAddresses?: Array<{ emailAddress: string }>;
    };
};

type GameState = 'lobby' | 'waiting' | 'countdown' | 'racing' | 'finished';

// Get display name from user info, with fallbacks
function getDisplayName(userInfo: Props['userInfo']): string {
    if (userInfo.username) return userInfo.username;
    if (userInfo.firstName) return userInfo.firstName;
    if (userInfo.emailAddresses?.[0]?.emailAddress) {
        return userInfo.emailAddresses[0].emailAddress.split('@')[0];
    }
    return 'Player';
}

export default function Multiplayer({ userInfo }: Props) {
    const { theme } = useTheme();
    const { isSignedIn, isLoaded } = useUser();
    const router = useRouter();
    const isSm = useIsSm();
    const [isLoading, setIsLoading] = useState(true);

    const displayName = useMemo(() => getDisplayName(userInfo), [userInfo]);

    // Game state
    const [gameState, setGameState] = useState<GameState>('lobby');
    const [raceId, setRaceId] = useState<Id<'races'> | null>(null);
    const [roomCode, setRoomCode] = useState<string>('');
    const [isHost, setIsHost] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [error, setError] = useState<string>('');

    // Typing state
    const [corpus, setCorpus] = useState<string>('');
    const [leftPadding, setLeftPadding] = useState(new Array(isSm ? 25 : 30).fill(' ').join(''));
    const [outgoingChars, setOutgoingChars] = useState<string>('');
    const [incorrectChar, setIncorrectChar] = useState<boolean>(false);
    const [currentChar, setCurrentChar] = useState<string>('');
    const [incomingChars, setIncomingChars] = useState<string>('');
    const [charCount, setCharCount] = useState<number>(0);
    const [wpm, setWpm] = useState<number>(0);
    const [seconds, setSeconds] = useState<number>(30);
    const [startTime, setStartTime] = useState<number>(0);

    // Convex mutations
    const createRace = useMutation(api.races.createRace);
    const joinRace = useMutation(api.races.joinRace);
    const startCountdown = useMutation(api.races.startCountdown);
    const startRacing = useMutation(api.races.startRacing);
    const updateProgress = useMutation(api.races.updateProgress);
    const finishRace = useMutation(api.races.finishRace);
    const leaveRace = useMutation(api.races.leaveRace);

    // Convex queries - subscribe to real-time updates
    const race = useQuery(api.races.getRace, raceId ? { raceId } : 'skip');
    const raceProgress = useQuery(api.races.getRaceProgress, raceId ? { raceId } : 'skip');

    const tabIcon = useMemo(
        () => (theme === 'light' ? AngelIcon.src : DevilIcon.src),
        [theme]
    );

    // Auth check
    useEffect(() => {
        if (isLoaded) {
            if (!isSignedIn) {
                router.push('/');
            } else {
                setIsLoading(false);
            }
        }
    }, [isSignedIn, isLoaded, router]);

    // Watch for race status changes
    useEffect(() => {
        if (!race) return;

        if (race.status === 'countdown' && gameState !== 'countdown') {
            setGameState('countdown');
            setCountdown(3);
        } else if (race.status === 'racing' && gameState !== 'racing') {
            setGameState('racing');
            setStartTime(race.startTime || Date.now());
        } else if (race.status === 'finished' && gameState !== 'finished') {
            setGameState('finished');
        }
    }, [race?.status, gameState, race?.startTime, race]);

    // Countdown timer
    useEffect(() => {
        if (gameState !== 'countdown') return;

        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            // Countdown finished, start racing
            if (isHost && raceId) {
                startRacing({ raceId });
            }
        }
    }, [countdown, gameState, isHost, raceId, startRacing]);

    // Race timer - only depends on seconds and gameState to avoid resetting on keypress
    useEffect(() => {
        if (gameState !== 'racing' || !startTime) return;

        if (seconds > 0) {
            const timer = setTimeout(() => {
                setSeconds(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seconds, gameState, startTime]);

    // WPM calculation - separate from timer
    useEffect(() => {
        if (gameState !== 'racing' || !startTime || charCount === 0) return;

        const durationInMinutes = (Date.now() - startTime) / 60000.0;
        const newWpm = Number((charCount / 5 / durationInMinutes).toFixed(2));
        setWpm(newWpm);
    }, [charCount, gameState, startTime]);

    // Handle time's up
    useEffect(() => {
        if (seconds === 0 && gameState === 'racing' && raceId) {
            finishRace({ raceId, userId: userInfo.id, finalWpm: wpm, charsTyped: charCount });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seconds, gameState]);

    // Progress update throttle
    const [lastProgressUpdate, setLastProgressUpdate] = useState(0);

    // Key press handler
    useKeyPress({
        callback: (key) => {
            if (gameState !== 'racing' || seconds === 0) return;

            if (key === currentChar) {
                setIncorrectChar(false);
                if (leftPadding.length > 0) {
                    setLeftPadding(leftPadding.substring(1));
                }

                const newOutgoing = outgoingChars + currentChar;
                setOutgoingChars(newOutgoing);
                setCurrentChar(incomingChars.charAt(0));
                setIncomingChars(incomingChars.substring(1));

                const newCharCount = charCount + 1;
                setCharCount(newCharCount);

                // Check if finished typing all chars
                if (incomingChars.length === 0) {
                    if (raceId) {
                        const durationInMinutes = (Date.now() - startTime) / 60000.0;
                        const finalWpm = Number((newCharCount / 5 / durationInMinutes).toFixed(2));
                        finishRace({ raceId, userId: userInfo.id, finalWpm, charsTyped: newCharCount });
                    }
                    return;
                }

                // Throttle progress updates to every 500ms
                const now = Date.now();
                if (raceId && now - lastProgressUpdate > 500) {
                    const durationInMinutes = (now - startTime) / 60000.0;
                    const currentWpm = Number((newCharCount / 5 / durationInMinutes).toFixed(2));
                    updateProgress({ raceId, userId: userInfo.id, charsTyped: newCharCount, wpm: currentWpm });
                    setLastProgressUpdate(now);
                }
            } else {
                setIncorrectChar(true);
            }
        },
    });

    // Create room handler
    const handleCreateRoom = useCallback(async () => {
        try {
            setError('');
            const result = await createRace({
                hostId: userInfo.id,
                hostUsername: displayName,
            });
            setRaceId(result.raceId);
            setRoomCode(result.code);
            setIsHost(true);
            setGameState('waiting');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create room');
        }
    }, [createRace, userInfo.id, displayName]);

    // Join room handler
    const handleJoinRoom = useCallback(async (code: string) => {
        try {
            setError('');
            const result = await joinRace({
                code: code.toUpperCase(),
                guestId: userInfo.id,
                guestUsername: displayName,
            });
            setRaceId(result.raceId);
            setRoomCode(code.toUpperCase());
            setCorpus(result.corpus);
            setCurrentChar(result.corpus.charAt(0));
            setIncomingChars(result.corpus.substring(1));
            setIsHost(false);
            setGameState('waiting');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to join room');
        }
    }, [joinRace, userInfo.id, displayName]);

    // Start race handler (host only)
    const handleStartRace = useCallback(async () => {
        if (!raceId || !isHost) return;
        try {
            setError('');
            await startCountdown({ raceId, userId: userInfo.id });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to start race');
        }
    }, [raceId, isHost, startCountdown, userInfo.id]);

    // Leave room handler
    const handleLeaveRoom = useCallback(async () => {
        if (raceId) {
            await leaveRace({ raceId, userId: userInfo.id });
        }
        setGameState('lobby');
        setRaceId(null);
        setRoomCode('');
        setIsHost(false);
        setCorpus('');
        setError('');
    }, [raceId, leaveRace, userInfo.id]);

    // Race again handler
    const handleRaceAgain = useCallback(() => {
        // Reset all state
        setGameState('lobby');
        setRaceId(null);
        setRoomCode('');
        setIsHost(false);
        setCorpus('');
        setLeftPadding(new Array(isSm ? 25 : 30).fill(' ').join(''));
        setOutgoingChars('');
        setIncorrectChar(false);
        setCurrentChar('');
        setIncomingChars('');
        setCharCount(0);
        setWpm(0);
        setSeconds(30);
        setStartTime(0);
        setCountdown(3);
        setError('');
    }, [isSm]);

    // Set corpus when race data loads (for host)
    useEffect(() => {
        if (race?.corpus && !corpus) {
            setCorpus(race.corpus);
            setCurrentChar(race.corpus.charAt(0));
            setIncomingChars(race.corpus.substring(1));
        }
    }, [race?.corpus, corpus]);

    // Get opponent info
    const opponentUsername = useMemo(() => {
        if (!race) return '';
        return isHost ? race.guestUsername : race.hostUsername;
    }, [race, isHost]);

    const myProgress = useMemo(() => {
        return raceProgress?.find(p => p.odId === userInfo.id);
    }, [raceProgress, userInfo.id]);

    const opponentProgress = useMemo(() => {
        return raceProgress?.find(p => p.odId !== userInfo.id);
    }, [raceProgress, userInfo.id]);

    if (isLoading) {
        return <TypingLoader message="Preparing multiplayer..." letters={['R', 'A', 'C', 'E']} />;
    }

    return (
        <>
            <Head>
                <title>Multiplayer - Typer Racer</title>
                <link rel="icon" href={tabIcon} />
            </Head>
            <ToggleButton />
            <div className="flex items-center justify-center relative min-h-screen pt-8">
                <div className="font-mono text-center max-w-3xl w-full px-4 mx-auto">
                    {/* Error display */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded">
                            {error}
                        </div>
                    )}

                    {/* Lobby */}
                    {gameState === 'lobby' && (
                        <MultiplayerLobby
                            onCreateRoom={handleCreateRoom}
                            onJoinRoom={handleJoinRoom}
                            onBack={() => router.push('/typer-racer')}
                        />
                    )}

                    {/* Waiting Room */}
                    {gameState === 'waiting' && (
                        <WaitingRoom
                            roomCode={roomCode}
                            isHost={isHost}
                            myUsername={displayName}
                            hostUsername={race?.hostUsername || displayName}
                            guestUsername={race?.guestUsername}
                            onStartRace={handleStartRace}
                            onLeave={handleLeaveRoom}
                        />
                    )}

                    {/* Countdown */}
                    {gameState === 'countdown' && (
                        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                            <div className="text-9xl font-bold text-white animate-pulse">
                                {countdown > 0 ? countdown : 'GO!'}
                            </div>
                        </div>
                    )}

                    {/* Racing */}
                    {(gameState === 'racing' || gameState === 'countdown') && (
                        <>
                            <RaceProgress
                                myProgress={{ charsTyped: charCount, wpm, username: displayName }}
                                opponentProgress={opponentProgress ? {
                                    charsTyped: opponentProgress.charsTyped,
                                    wpm: opponentProgress.wpm,
                                    username: opponentUsername || 'Opponent',
                                    disconnected: opponentProgress.disconnected,
                                } : undefined}
                                totalChars={corpus.length}
                            />
                            <div className="mb-4">
                                <h3 className="text-center">WPM: {wpm} | Time: {seconds}s</h3>
                            </div>
                            <TypingBoard
                                currentChar={currentChar}
                                incomingChars={incomingChars}
                                incorrectChar={incorrectChar}
                                isSm={isSm}
                                leftPadding={leftPadding}
                                outgoingChars={outgoingChars}
                            />
                            {opponentProgress?.disconnected && (
                                <div className="mt-4 p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-100 rounded">
                                    Opponent disconnected - continue for your score!
                                </div>
                            )}
                        </>
                    )}

                    {/* Results */}
                    {gameState === 'finished' && (
                        <MultiplayerResults
                            myWpm={myProgress?.wpm || wpm}
                            opponentWpm={opponentProgress?.wpm || 0}
                            myUsername={displayName}
                            opponentUsername={opponentUsername || 'Opponent'}
                            opponentDisconnected={opponentProgress?.disconnected || false}
                            onRaceAgain={handleRaceAgain}
                            onLeave={() => router.push('/typer-racer')}
                        />
                    )}
                </div>
            </div>
        </>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { userId } = getAuth(context.req);
    const user = userId ? await clerkClient.users.getUser(userId) : undefined;
    const {
        __clerk_ssr_state: {
            // @ts-ignore
            user: userInfo,
        },
    } = buildClerkProps(context.req, { user });

    return { props: { userInfo } };
};
