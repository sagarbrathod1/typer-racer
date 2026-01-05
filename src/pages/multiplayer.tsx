import { AngelIcon, DevilIcon } from '@/assets/images';
import ToggleButton from '@/components/ToggleButton/ToggleButton';
import TypingLoader from '@/components/TypingLoader';
import { useTheme } from 'next-themes';
import Head from 'next/head';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import useTypingGame from '@/hooks/useTypingGame';
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

    const [gameState, setGameState] = useState<GameState>('lobby');
    const [raceId, setRaceId] = useState<Id<'races'> | null>(null);
    const [roomCode, setRoomCode] = useState<string>('');
    const [isHost, setIsHost] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [error, setError] = useState<string>('');
    const [corpus, setCorpus] = useState<string>('');
    const [raceStartTime, setRaceStartTime] = useState<number>(0);

    // Throttle for progress updates
    const lastProgressUpdateRef = useRef(0);

    const createRace = useMutation(api.races.createRace);
    const joinRace = useMutation(api.races.joinRace);
    const startCountdown = useMutation(api.races.startCountdown);
    const startRacing = useMutation(api.races.startRacing);
    const updateProgress = useMutation(api.races.updateProgress);
    const finishRace = useMutation(api.races.finishRace);
    const leaveRace = useMutation(api.races.leaveRace);

    const race = useQuery(api.races.getRace, raceId ? { raceId } : 'skip');
    const raceProgress = useQuery(api.races.getRaceProgress, raceId ? { raceId } : 'skip');

    const tabIcon = useMemo(() => (theme === 'light' ? AngelIcon.src : DevilIcon.src), [theme]);

    // Progress update callback with throttling
    const handleProgress = useCallback(
        (newCharCount: number, currentWpm: number) => {
            if (!raceId) return;
            const now = Date.now();
            if (now - lastProgressUpdateRef.current > 500) {
                updateProgress({
                    raceId,
                    userId: userInfo.id,
                    charsTyped: newCharCount,
                    wpm: currentWpm,
                });
                lastProgressUpdateRef.current = now;
            }
        },
        [raceId, updateProgress, userInfo.id]
    );

    // Finish callback
    const handleFinish = useCallback(
        (finalWpm: number, charsTyped: number) => {
            if (!raceId) return;
            finishRace({
                raceId,
                userId: userInfo.id,
                finalWpm,
                charsTyped,
            });
        },
        [raceId, finishRace, userInfo.id]
    );

    // Use the typing game hook
    const game = useTypingGame({
        corpus,
        isSm,
        disabled: gameState !== 'racing',
        externalStartTime: raceStartTime,
        onProgress: handleProgress,
        onFinish: handleFinish,
    });

    useEffect(() => {
        if (isLoaded) {
            if (!isSignedIn) {
                router.push('/');
            } else {
                setIsLoading(false);
            }
        }
    }, [isSignedIn, isLoaded, router]);

    // Sync game state with race status from server
    useEffect(() => {
        if (!race) return;

        if (race.status === 'countdown' && gameState !== 'countdown') {
            setGameState('countdown');
            setCountdown(3);
        } else if (race.status === 'racing' && gameState !== 'racing') {
            setGameState('racing');
            setRaceStartTime(race.startTime || Date.now());
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
            if (isHost && raceId) {
                startRacing({ raceId });
            }
        }
    }, [countdown, gameState, isHost, raceId, startRacing]);

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

    const handleJoinRoom = useCallback(
        async (code: string) => {
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
                setIsHost(false);
                setGameState('waiting');
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to join room');
            }
        },
        [joinRace, userInfo.id, displayName]
    );

    const handleStartRace = useCallback(async () => {
        if (!raceId || !isHost) return;
        try {
            setError('');
            await startCountdown({ raceId, userId: userInfo.id });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to start race');
        }
    }, [raceId, isHost, startCountdown, userInfo.id]);

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

    const handleRaceAgain = useCallback(() => {
        setGameState('lobby');
        setRaceId(null);
        setRoomCode('');
        setIsHost(false);
        setCorpus('');
        setRaceStartTime(0);
        setCountdown(3);
        setError('');
        game.resetState();
    }, [game]);

    // Sync corpus from server (for host who doesn't get it from joinRace)
    useEffect(() => {
        if (race?.corpus && !corpus) {
            setCorpus(race.corpus);
        }
    }, [race?.corpus, corpus]);

    const opponentUsername = useMemo(() => {
        if (!race) return '';
        return isHost ? race.guestUsername : race.hostUsername;
    }, [race, isHost]);

    const myProgress = useMemo(() => {
        return raceProgress?.find((p) => p.odId === userInfo.id);
    }, [raceProgress, userInfo.id]);

    const opponentProgress = useMemo(() => {
        return raceProgress?.find((p) => p.odId !== userInfo.id);
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

                    {gameState === 'lobby' && (
                        <MultiplayerLobby
                            onCreateRoom={handleCreateRoom}
                            onJoinRoom={handleJoinRoom}
                            onBack={() => router.push('/typer-racer')}
                        />
                    )}

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

                    {gameState === 'countdown' && (
                        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                            <div className="text-9xl font-bold text-white animate-pulse">
                                {countdown > 0 ? countdown : 'GO!'}
                            </div>
                        </div>
                    )}

                    {(gameState === 'racing' || gameState === 'countdown') && (
                        <>
                            <RaceProgress
                                myProgress={{ charsTyped: game.charCount, wpm: game.wpm, username: displayName }}
                                opponentProgress={
                                    opponentProgress
                                        ? {
                                              charsTyped: opponentProgress.charsTyped,
                                              wpm: opponentProgress.wpm,
                                              username: opponentUsername || 'Opponent',
                                              disconnected: opponentProgress.disconnected,
                                          }
                                        : undefined
                                }
                                totalChars={corpus.length}
                            />
                            <div className="mb-4">
                                <h3 className="text-center">
                                    WPM: {game.wpm} | Time: {game.seconds}s
                                </h3>
                            </div>
                            <TypingBoard
                                currentChar={game.currentChar}
                                incomingChars={game.incomingChars}
                                incorrectChar={game.incorrectChar}
                                isSm={isSm}
                                leftPadding={game.leftPadding}
                                outgoingChars={game.outgoingChars}
                            />
                            {opponentProgress?.disconnected && (
                                <div className="mt-4 p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-100 rounded">
                                    Opponent disconnected - continue for your score!
                                </div>
                            )}
                        </>
                    )}

                    {gameState === 'finished' && (
                        <MultiplayerResults
                            myWpm={myProgress?.wpm || game.wpm}
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
