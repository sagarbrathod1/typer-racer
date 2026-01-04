import { FunctionComponent, useMemo } from 'react';

type Props = {
    errorMap: Record<string, number>;
    theme?: string;
};

const MistakeHeatmap: FunctionComponent<Props> = ({ errorMap = {}, theme }) => {
    const sortedErrors = useMemo(() => {
        if (!errorMap || typeof errorMap !== 'object') return [];
        return Object.entries(errorMap)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);
    }, [errorMap]);

    const maxErrors = useMemo(() => {
        if (sortedErrors.length === 0) return 1;
        return sortedErrors[0][1];
    }, [sortedErrors]);

    if (sortedErrors.length === 0) {
        return null;
    }

    const getBarColor = (count: number) => {
        const intensity = count / maxErrors;
        if (intensity > 0.7) return 'bg-red-500';
        if (intensity > 0.4) return 'bg-orange-400';
        return 'bg-yellow-400';
    };

    const formatChar = (char: string) => {
        if (char === ' ') return 'Space';
        if (char === '\n') return 'Enter';
        if (char === '\t') return 'Tab';
        return char;
    };

    return (
        <div className="mt-3 mb-4">
            <h4 className="text-xs text-gray-500 dark:text-gray-500 mb-2">Top mistakes</h4>
            <div className="space-y-1">
                {sortedErrors.map(([char, count]) => (
                    <div key={char} className="flex items-center gap-2">
                        <span className="w-10 text-right font-mono text-xs">
                            {formatChar(char)}
                        </span>
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                            <div
                                className={`h-full ${getBarColor(
                                    count
                                )} transition-all duration-300`}
                                style={{ width: `${(count / maxErrors) * 100}%` }}
                            />
                        </div>
                        <span className="w-6 text-xs text-gray-500 dark:text-gray-400">
                            {count}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MistakeHeatmap;
