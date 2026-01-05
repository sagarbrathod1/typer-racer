import { useState, useEffect, useCallback, useRef } from 'react';
import useKeyPress from './useKeyPress';

const GAME_DURATION = 30;

type UseTypingGameProps = {
    corpus: string;
    isSm: boolean;
    disabled?: boolean;
    // Optional callbacks for multiplayer sync
    onProgress?: (charCount: number, wpm: number) => void;
    onFinish?: (finalWpm: number, charCount: number) => void;
    // External start time for multiplayer (synced from server)
    externalStartTime?: number;
};

type UseTypingGameReturn = {
    // Game state
    wpm: number;
    seconds: number;
    currentChar: string;
    incomingChars: string;
    outgoingChars: string;
    leftPadding: string;
    incorrectChar: boolean;
    wordCount: number;
    charCount: number;
    errorCount: number;
    errorMap: Record<string, number>;
    wpmArray: number[];
    startTime: number;
    endTime: number;
    skipMode: boolean;
    isGameOver: boolean;
    isGameStarted: boolean;

    // Actions
    resetState: () => void;
    skipToResults: () => void;

    // Setters (for restoring saved state)
    setWpm: (wpm: number) => void;
    setWpmArray: (wpmArray: number[]) => void;
    setErrorCount: (errorCount: number) => void;
    setTime: (seconds: number) => void;
};

export default function useTypingGame({
    corpus,
    isSm,
    disabled = false,
    onProgress,
    onFinish,
    externalStartTime,
}: UseTypingGameProps): UseTypingGameReturn {
    const paddingLength = isSm ? 25 : 30;

    // Game state
    const [wpm, setWpm] = useState<number>(0);
    const [seconds, setSeconds] = useState<number>(GAME_DURATION);
    const [leftPadding, setLeftPadding] = useState(() =>
        new Array(paddingLength).fill(' ').join('')
    );
    const [outgoingChars, setOutgoingChars] = useState<string>('');
    const [incorrectChar, setIncorrectChar] = useState<boolean>(false);
    const [currentChar, setCurrentChar] = useState<string>('');
    const [incomingChars, setIncomingChars] = useState<string>('');
    const [startTime, setStartTime] = useState<number>(0);
    const [endTime, setEndTime] = useState<number>(0);
    const [wordCount, setWordCount] = useState<number>(0);
    const [charCount, setCharCount] = useState<number>(0);
    const [wpmArray, setWpmArray] = useState<number[]>([]);
    const [errorCount, setErrorCount] = useState<number>(0);
    const [errorMap, setErrorMap] = useState<Record<string, number>>({});
    const [skipMode, setSkipMode] = useState<boolean>(false);

    const charCountRef = useRef(charCount);
    useEffect(() => {
        charCountRef.current = charCount;
    }, [charCount]);

    // Refs for callbacks to avoid stale closures
    const onProgressRef = useRef(onProgress);
    const onFinishRef = useRef(onFinish);
    const startTimeRef = useRef(startTime);
    useEffect(() => {
        onProgressRef.current = onProgress;
    }, [onProgress]);
    useEffect(() => {
        onFinishRef.current = onFinish;
    }, [onFinish]);
    useEffect(() => {
        startTimeRef.current = startTime;
    }, [startTime]);

    // Derived state
    const isGameOver = seconds === 0;
    const isGameStarted = startTime > 0;

    // Use external start time if provided (for multiplayer sync)
    useEffect(() => {
        if (externalStartTime && externalStartTime > 0 && startTime === 0) {
            setStartTime(externalStartTime);
        }
    }, [externalStartTime, startTime]);

    // Initialize from corpus
    useEffect(() => {
        if (corpus && corpus.trim() !== '') {
            setCurrentChar(corpus.charAt(0));
            setIncomingChars(corpus.substr(1));
        }
    }, [corpus]);

    // Timer and WPM calculation
    useEffect(() => {
        if (seconds <= 0 || !startTime) return;

        const timeoutId = setTimeout(() => {
            const newSeconds = seconds - 1;
            setSeconds(newSeconds);
            const durationInMinutes = (Date.now() - startTime) / 60000.0;
            const newWpm = Number((charCountRef.current / 5 / durationInMinutes).toFixed(2));
            setWpm(newWpm);
            setWpmArray((prev) => [...prev, newWpm]);

            if (newSeconds === 0) {
                setEndTime(Date.now());
                onFinishRef.current?.(newWpm, charCountRef.current);
            }
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [seconds, startTime]);

    // Key press handler
    useKeyPress({
        callback: (key) => {
            if (skipMode || disabled) return;

            // Auto-start timer on first keypress only if no external start time
            if (!startTime && !externalStartTime) {
                setStartTime(Date.now());
            }

            // Don't process keys if timer hasn't started yet (waiting for external start)
            if (!startTime) return;

            if (seconds === 0) return;

            if (key === currentChar) {
                setIncorrectChar(false);

                if (leftPadding.length > 0) {
                    setLeftPadding((prev) => prev.substring(1));
                }

                setOutgoingChars((prev) => prev + currentChar);
                setCurrentChar(incomingChars.charAt(0));
                setIncomingChars((prev) => prev.substring(1));
                const newCharCount = charCountRef.current + 1;
                setCharCount(newCharCount);

                if (incomingChars.charAt(0) === ' ') {
                    setWordCount((prev) => prev + 1);
                }

                // Calculate current WPM for callbacks
                const now = Date.now();
                const durationInMinutes = (now - startTimeRef.current) / 60000.0;
                const currentWpm = durationInMinutes > 0
                    ? Number((newCharCount / 5 / durationInMinutes).toFixed(2))
                    : 0;

                // Call onProgress callback
                onProgressRef.current?.(newCharCount, currentWpm);

                // If corpus is complete, finish the game
                if (incomingChars.length === 0) {
                    setEndTime(now);
                    setSeconds(0);
                    onFinishRef.current?.(currentWpm, newCharCount);
                }
            } else {
                setIncorrectChar(true);
                setErrorCount((prev) => prev + 1);
                setErrorMap((prev) => ({
                    ...prev,
                    [currentChar]: (prev[currentChar] || 0) + 1,
                }));
            }
        },
    });

    const resetState = useCallback(() => {
        setLeftPadding(new Array(paddingLength).fill(' ').join(''));
        setOutgoingChars('');
        setCurrentChar(corpus.charAt(0));
        setIncomingChars(corpus.substr(1));
        setStartTime(0);
        setEndTime(0);
        setWordCount(0);
        setCharCount(0);
        setWpm(0);
        setSeconds(GAME_DURATION);
        setWpmArray([]);
        setIncorrectChar(false);
        setErrorCount(0);
        setErrorMap({});
        setSkipMode(false);
    }, [corpus, paddingLength]);

    const skipToResults = useCallback(() => {
        setSkipMode(true);
        setSeconds(0);
        setWpm(0);
        setWpmArray([]);
    }, []);

    return {
        // Game state
        wpm,
        seconds,
        currentChar,
        incomingChars,
        outgoingChars,
        leftPadding,
        incorrectChar,
        wordCount,
        charCount,
        errorCount,
        errorMap,
        wpmArray,
        startTime,
        endTime,
        skipMode,
        isGameOver,
        isGameStarted,

        // Actions
        resetState,
        skipToResults,

        // Setters (for restoring saved state)
        setWpm,
        setWpmArray,
        setErrorCount,
        setTime: setSeconds,
    };
}
