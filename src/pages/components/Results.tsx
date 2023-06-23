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
    return (
        <div className="font-mono px-4 sm:px-0">
            <div className="h-64">
                <MyResponsiveLine
                    data={[
                        {
                            id: 'Sagar',
                            color: 'hsl(359, 70%, 50%)',
                            data: sagarWpm.map((e, i) => ({ x: i + 1, y: e })),
                        },
                        {
                            id: 'You',
                            data: wpmArray.map((e, i) => ({ x: i + 1, y: e })),
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
                    Your accuracy: {((corpus.length - errorCount) / corpus.length).toFixed(2)}
                </h3>
                <h3 className="sagar-text-decoration underline decoration-3">
                    Sagar&apos;s accuracy: 1.00
                </h3>
            </div>
        </div>
    );
};

export default Results;
