type PlayerProgress = {
    charsTyped: number;
    wpm: number;
    username: string;
    disconnected?: boolean;
};

type Props = {
    myProgress: PlayerProgress;
    opponentProgress?: PlayerProgress;
    totalChars: number;
};

export default function RaceProgress({ myProgress, opponentProgress, totalChars }: Props) {
    const myPercentage = totalChars > 0 ? (myProgress.charsTyped / totalChars) * 100 : 0;
    const opponentPercentage =
        opponentProgress && totalChars > 0 ? (opponentProgress.charsTyped / totalChars) * 100 : 0;

    return (
        <div className="mb-6 space-y-3">
            <div className="space-y-1">
                <div className="flex justify-between text-sm">
                    <span className="font-medium">{myProgress.username} (You)</span>
                    <span>{myProgress.wpm} WPM</span>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 transition-all duration-300 ease-out"
                        style={{ width: `${Math.min(myPercentage, 100)}%` }}
                    />
                </div>
            </div>

            {/* Opponent Progress */}
            {opponentProgress && (
                <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <span
                            className={`font-medium ${
                                opponentProgress.disconnected ? 'text-gray-400' : ''
                            }`}
                        >
                            {opponentProgress.username}
                            {opponentProgress.disconnected && ' (Disconnected)'}
                        </span>
                        <span className={opponentProgress.disconnected ? 'text-gray-400' : ''}>
                            {opponentProgress.wpm} WPM
                        </span>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ease-out ${
                                opponentProgress.disconnected ? 'bg-gray-400' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(opponentPercentage, 100)}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
