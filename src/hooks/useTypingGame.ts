import { useState, useEffect, useCallback } from 'react';
import useKeyPress from './useKeyPress';

const GAME_DURATION = 30;

type UseTypingGameProps = {
    corpus: string;
    isSm: boolean;
    disabled?: boolean;
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
    const [wordCount, setWordCount] = useState<number>(0);
    const [charCount, setCharCount] = useState<number>(0);
    const [wpmArray, setWpmArray] = useState<number[]>([]);
    const [errorCount, setErrorCount] = useState<number>(0);
    const [errorMap, setErrorMap] = useState<Record<string, number>>({});
    const [skipMode, setSkipMode] = useState<boolean>(false);

    // Derived state
    const isGameOver = seconds === 0;
    const isGameStarted = startTime > 0;

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
            setSeconds((prev) => prev - 1);
            const durationInMinutes = (Date.now() - startTime) / 60000.0;
            const newWpm = Number((charCount / 5 / durationInMinutes).toFixed(2));
            setWpm(newWpm);
            setWpmArray((prev) => [...prev, newWpm]);
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [seconds, startTime, charCount]);

    // Key press handler
    useKeyPress({
        callback: (key) => {
            if (skipMode || disabled) return;

            if (!startTime) {
                setStartTime(Date.now());
            }

            if (seconds === 0) return;

            if (key === currentChar) {
                setIncorrectChar(false);

                if (leftPadding.length > 0) {
                    setLeftPadding((prev) => prev.substring(1));
                }

                setOutgoingChars((prev) => prev + currentChar);
                setCurrentChar(incomingChars.charAt(0));
                setIncomingChars((prev) => prev.substring(1));
                setCharCount((prev) => prev + 1);

                if (incomingChars.charAt(0) === ' ') {
                    setWordCount((prev) => prev + 1);
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
