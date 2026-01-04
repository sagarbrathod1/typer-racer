import MyResponsiveLine from '@/components/LineGraph/MyResponsiveLine';
import { UserModel } from '@/types/models';
import { FunctionComponent, useCallback, useState } from 'react';
import Loader from 'react-loader-spinner';
import { SignInButton } from '@clerk/nextjs';
import MistakeHeatmap from './MistakeHeatmap';

const PENDING_SCORE_KEY = 'typer-racer-pending-score';

type Props = {
    sagarWpm: string[];
    wpmArray: number[];
    theme: string | undefined;
    wpm: number;
    corpus: string;
    errorCount: number;
    errorMap?: Record<string, number>;
    leaderboard: UserModel[];
    postLeaderboard: (score: number, callback: () => void) => Promise<void>;
    submitLeaderboardLoading: boolean;
    skipMode?: boolean;
    isGuest?: boolean;
};

const Results: FunctionComponent<Props> = ({
    sagarWpm,
    wpmArray,
    theme,
    wpm,
    corpus,
    errorCount,
    errorMap = {},
    leaderboard,
    postLeaderboard,
    submitLeaderboardLoading,
    skipMode = false,
    isGuest = false,
}) => {
    const [wasSaved, setWasSaved] = useState<boolean>(false);
    const [showHeatmap, setShowHeatmap] = useState<boolean>(false);

    const afterSaveCallback = useCallback(() => {
        setWasSaved(true);
    }, [setWasSaved]);

    const sagarWpmData = sagarWpm ? sagarWpm.map((e, i) => ({ x: i + 1, y: e })) : [];
    const wpmArrayData = wpmArray ? wpmArray.map((e, i) => ({ x: i + 1, y: e })) : [];

    const sagarWpmLastElement = sagarWpm ? sagarWpm[sagarWpm.length - 1] : '';

    const corpusLength = corpus ? corpus.length : 0;
    const accuracy = corpusLength ? ((corpusLength - errorCount) / corpusLength).toFixed(2) : 0;

    return (
        <div className="font-mono px-4 sm:px-0">
            <div className="h-64 mb-4">
                <MyResponsiveLine
                    data={[
                        {
                            id: 'Sagar',
                            color: 'hsl(359, 70%, 50%)',
                            data: sagarWpmData,
                        },
                        {
                            id: 'You',
                            data: wpmArrayData,
                        },
                    ]}
                    axisLeftName="WPM"
                    axisBottomName="Time (seconds)"
                    theme={theme}
                />
            </div>
            <div className="flex justify-between mb-2">
                <h3 className="you-text-decoration underline decoration-3">Your WPM: {wpm}</h3>
                <h3 className="sagar-text-decoration underline decoration-3">
                    Sagar&apos;s WPM: {sagarWpmLastElement}
                </h3>
            </div>
            <div className="flex justify-between mb-4">
                <h3 className="you-text-decoration underline decoration-3">
                    Your accuracy: {accuracy}
                </h3>
                <h3 className="sagar-text-decoration underline decoration-3">
                    Sagar&apos;s accuracy: 1.00
                </h3>
            </div>
            {!skipMode && Object.keys(errorMap).length > 0 && (
                <div className="mt-4">
                    <button
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
                    >
                        {showHeatmap ? 'Hide trouble spots' : 'Show trouble spots'}
                    </button>
                    {showHeatmap && <MistakeHeatmap errorMap={errorMap} theme={theme} />}
                </div>
            )}
            {!skipMode && (
                <div className="flex justify-center my-4">
                    <div id="try-again-button-slot"></div>
                </div>
            )}
            <div>
                <h3 className="underline decoration-7 mb-2">Leaderboard</h3>
                {leaderboard?.map((user, i) => {
                    return (
                        <h3 className="text-left" key={i}>
                            {i + 1}. {user.user}: {user.adjusted_wpm} WPM
                        </h3>
                    );
                })}
                <div className="flex flex-col items-center mb-1">
                    {!skipMode && !wasSaved && wpm > 0 && !submitLeaderboardLoading && !isGuest && (
                        <button
                            onClick={() => postLeaderboard(wpm, afterSaveCallback)}
                            className="mt-4 mb-6 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 py-1.5 px-3 rounded-sm transition-colors"
                        >
                            Submit
                        </button>
                    )}
                    {!skipMode && isGuest && wpm > 0 && (
                        <div className="mt-4 mb-6 flex flex-col items-center gap-2">
                            <SignInButton mode="modal" redirectUrl="/typer-racer">
                                <button
                                    onClick={() => {
                                        sessionStorage.setItem(
                                            PENDING_SCORE_KEY,
                                            JSON.stringify({ wpm, wpmArray, errorCount })
                                        );
                                    }}
                                    className="border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 py-1.5 px-3 rounded-sm transition-colors"
                                >
                                    Sign in to save score
                                </button>
                            </SignInButton>
                            <span className="text-sm text-gray-500">Your WPM: {wpm}</span>
                        </div>
                    )}
                    {wasSaved && <span className="my-2">Your WPM was successfully saved!</span>}
                    {submitLeaderboardLoading && (
                        <div className="mt-4 mb-6 py-1.5 px-3">
                            <Loader
                                type="TailSpin"
                                color={theme === 'dark' ? '#fff' : '#000'}
                                height={16}
                                width={16}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Results;
