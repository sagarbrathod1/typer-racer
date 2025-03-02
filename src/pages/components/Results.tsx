import MyResponsiveLine from '@/components/LineGraph/MyResponsiveLine';
import { UserModel } from '@/types/models';
import { FunctionComponent, useCallback, useRef, useState } from 'react';
import Loader from 'react-loader-spinner';

type Props = {
    sagarWpm: string[];
    wpmArray: number[];
    theme: string | undefined;
    wpm: number;
    corpus: string;
    errorCount: number;
    leaderboard: UserModel[];
    postLeaderboard: (score: number, callback: () => void) => Promise<void>;
    submitLeaderboardLoading: boolean;
    skipMode?: boolean;
};

const Results: FunctionComponent<Props> = ({
    sagarWpm,
    wpmArray,
    theme,
    wpm,
    corpus,
    errorCount,
    leaderboard,
    postLeaderboard,
    submitLeaderboardLoading,
    skipMode = false,
}) => {
    const [wasSaved, setWasSaved] = useState<boolean>(false);

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
                    {!skipMode && !wasSaved && wpm > 0 && !submitLeaderboardLoading && (
                        <button
                            onClick={() => postLeaderboard(wpm, afterSaveCallback)}
                            className="mt-4 mb-6 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 py-1.5 px-3 rounded-sm transition-colors"
                        >
                            Submit
                        </button>
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
