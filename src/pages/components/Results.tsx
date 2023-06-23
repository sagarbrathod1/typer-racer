import MyResponsiveLine from '@/components/LineGraph/MyResponsiveLine';
import { FunctionComponent, useRef } from 'react';

type Props = {
    sagarWpm: string[];
    wpmArray: number[];
    theme: string | undefined;
    wpm: number;
    corpus: string;
    errorCount: number;
};

const Results: FunctionComponent<Props> = ({
    sagarWpm,
    wpmArray,
    theme,
    wpm,
    corpus,
    errorCount,
}) => {
    // Check if sagarWpm and wpmArray are defined before mapping over them
    const sagarWpmData = sagarWpm ? sagarWpm.map((e, i) => ({ x: i + 1, y: e })) : [];
    const wpmArrayData = wpmArray ? wpmArray.map((e, i) => ({ x: i + 1, y: e })) : [];

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
                    Sagar&apos;s WPM: {sagarWpm[sagarWpm.length - 1]}
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
        </div>
    );
};

export default Results;
