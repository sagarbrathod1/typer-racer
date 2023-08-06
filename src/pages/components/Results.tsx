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
}) => {
    const [wasSaved, setWasSaved] = useState<boolean>(false);

    const afterSaveCallback = useCallback(() => {
        setWasSaved(true);
    }, [setWasSaved]);

    // Check if sagarWpm and wpmArray are defined before mapping over them
    const sagarWpmData = sagarWpm ? sagarWpm.map((e, i) => ({ x: i + 1, y: e })) : [];
    const wpmArrayData = wpmArray ? wpmArray.map((e, i) => ({ x: i + 1, y: e })) : [];

    // Check if sagarWpm is defined before accessing its properties
    const sagarWpmLastElement = sagarWpm ? sagarWpm[sagarWpm.length - 1] : '';

    // Check if corpus is defined before accessing its length property
    const corpusLength = corpus ? corpus.length : 0;
    const accuracy = corpusLength ? ((corpusLength - errorCount) / corpusLength).toFixed(2) : 0;

    return (
        <div className="font-mono px-4 sm:px-0">
            <div className="h-64">
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
            <div className="flex justify-between">
                <h3 className="you-text-decoration underline decoration-3">Your WPM: {wpm}</h3>
                <h3 className="sagar-text-decoration underline decoration-3">
                    Sagar&apos;s WPM: {sagarWpmLastElement}
                </h3>
            </div>
            <div className="flex justify-between mb-8">
                <h3 className="you-text-decoration underline decoration-3">
                    Your accuracy: {accuracy}
                </h3>
                <h3 className="sagar-text-decoration underline decoration-3">
                    Sagar&apos;s accuracy: 1.00
                </h3>
            </div>
            <div>
                <h3>Leaderboard</h3>
                {leaderboard?.map((user, i) => {
                    return (
                        <h3 className="text-left" key={i}>
                            {i + 1}. {user.user}: {user.adjusted_wpm} WPM
                        </h3>
                    );
                })}
                <div className="flex flex-col items-center">
                    {!wasSaved && (
                        <button
                            className="my-2"
                            onClick={() => postLeaderboard(wpm, afterSaveCallback)}
                        >
                            Submit
                        </button>
                    )}
                    {wasSaved && <span className="my-2">Your WPM was successfully saved!</span>}
                    {submitLeaderboardLoading && (
                        <div className={'my-3'}>
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
