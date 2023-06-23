import { AngelIcon, DevilIcon } from '@/assets/images';
import ToggleButton from '@/components/ToggleButton/ToggleButton';
import { useTheme } from 'next-themes';
import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import TypingBoard from './components/TypingBoard';
import useDatabaseInfo from '../hooks/useDatabaseInfo';
import useKeyPress from '../hooks/useKeyPress';
import { useIsSm } from '../hooks/useMediaQuery';
import Results from './components/Results';

export default function TyperRacer() {
    const isSm = useIsSm();

    const [wpm, setWpm] = useState<number>(0);
    const [seconds, setTime] = useState<number>(30);

    const [leftPadding, setLeftPadding] = useState(new Array(isSm ? 25 : 30).fill(' ').join('')); // initial 50 spaces to keep current char at center
    const [outgoingChars, setOutgoingChars] = useState<string>(''); // characters just typed
    const [incorrectChar, setIncorrectChar] = useState<boolean>(false);
    const [corpus, setCorpus] = useState<string>('');
    const [corpusId, _setCorpusId] = useState(Math.floor(Math.random() * 3) + 1);
    const [currentChar, setCurrentChar] = useState<string>(corpus.charAt(0));
    const [incomingChars, setIncomingChars] = useState(corpus.substr(1)); // next chars to type
    const [startTime, setStartTime] = useState<number>(0);
    const [wordCount, setWordCount] = useState<number>(0);
    const [charCount, setCharCount] = useState<number>(0);
    const [wpmArray, setWpmArray] = useState<number[]>([]);
    const [errorCount, setErrorCount] = useState<number>(0);

    const { words, sagarWpm, loading } = useDatabaseInfo();

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
    }, [seconds, startTime]);

    useKeyPress({
        callback: (key) => {
            // Start the timer
            if (!startTime) {
                setStartTime(currentTime);
            }

            // Don't register any keypresses after time is up
            if (seconds === 0 || loading) {
                return;
            }

            let updatedOutgoingChars = outgoingChars;
            let updatedIncomingChars = incomingChars;

            if (key === currentChar) {
                setIncorrectChar(false);
                // For the first 20 characters, move leftPadding forward
                if (leftPadding.length > 0) {
                    setLeftPadding(leftPadding.substring(1));
                }

                // Current char is now in outgoing chars
                updatedOutgoingChars += currentChar;
                setOutgoingChars(updatedOutgoingChars);

                // Current char is now the next letter
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
    }, [corpus, isSm]);

    return (
        <>
            <Head>
                <title>Typer Racer</title>
                <link rel="icon" href={tabIcon} />
            </Head>
            <>
                <ToggleButton />
                <div className="flex items-center justify-center relative h-screen">
                    <div className="font-mono text-center">
                        <h3 className="text-center sm:text-left">WPM: {wpm}</h3>
                        <h3 className="text-center sm:text-left">Time: {seconds}</h3>
                        {loading ? (
                            <p className="whitespace-pre width-race-me-text">
                                {' '}
                                <span className="text-gray-400">
                                    {Array(16).fill(' ').join('').slice(-30)}
                                </span>
                                Loading corpus...
                            </p>
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
                        <div
                            className={
                                'flex-col justify-center mb-4 ' + (startTime && 'hidden-animate')
                            }
                        >
                            <span>^</span>
                            <p>Start typing</p>
                        </div>
                        <span
                            className={'' + (startTime && 'cursor-pointer')}
                            onClick={() => resetState()}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={
                                    'h-5 w-5 ml-auto mr-auto mb-4 ' +
                                    (!startTime && 'text-gray-400')
                                }
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                        </span>
                        {seconds === 0 && (
                            <Results
                                sagarWpm={sagarWpm}
                                wpm={wpm}
                                wpmArray={wpmArray}
                                corpus={corpus}
                                errorCount={errorCount}
                                theme={theme}
                            />
                        )}
                    </div>
                </div>
            </>
        </>
    );
}
