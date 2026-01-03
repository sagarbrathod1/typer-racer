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
            .slice(0, 10); // Top 10 problem characters
    }, [errorMap]);

    const maxErrors = useMemo(() => {
        if (sortedErrors.length === 0) return 1;
        return sortedErrors[0][1];
    }, [sortedErrors]);

    if (sortedErrors.length === 0) {
        return null;
    }

    // Get color intensity based on error count
    const getBarColor = (count: number) => {
        const intensity = count / maxErrors;
        if (intensity > 0.7) return 'bg-red-500';
        if (intensity > 0.4) return 'bg-orange-400';
        return 'bg-yellow-400';
    };

    // Format character for display (show space as "Space")
    const formatChar = (char: string) => {
        if (char === ' ') return 'Space';
        if (char === '\n') return 'Enter';
        if (char === '\t') return 'Tab';
        return char;
    };

    return (
        <div className="mt-6 mb-4">
            <h3 className="text-sm font-medium mb-3 text-gray-600 dark:text-gray-400">
                Trouble spots
            </h3>
            <div className="space-y-2">
                {sortedErrors.map(([char, count]) => (
                    <div key={char} className="flex items-center gap-2">
                        <span className="w-12 text-right font-mono text-sm">
                            {formatChar(char)}
                        </span>
                        <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                            <div
                                className={`h-full ${getBarColor(count)} transition-all duration-300`}
                                style={{ width: `${(count / maxErrors) * 100}%` }}
                            />
                        </div>
                        <span className="w-8 text-sm text-gray-500 dark:text-gray-400">
                            {count}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MistakeHeatmap;
