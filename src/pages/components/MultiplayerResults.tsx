type Props = {
    myWpm: number;
    opponentWpm: number;
    myUsername: string;
    opponentUsername: string;
    opponentDisconnected: boolean;
    onRaceAgain: () => void;
    onLeave: () => void;
};

export default function MultiplayerResults({
    myWpm,
    opponentWpm,
    myUsername,
    opponentUsername,
    opponentDisconnected,
    onRaceAgain,
    onLeave,
}: Props) {
    const didWin = opponentDisconnected || myWpm > opponentWpm;
    const isTie = !opponentDisconnected && myWpm === opponentWpm;

    return (
        <div className="space-y-8">
            {/* Winner Banner */}
            <div className={`p-6 rounded-lg ${
                isTie
                    ? 'bg-gray-100 dark:bg-gray-800'
                    : didWin
                        ? 'bg-green-100 dark:bg-green-900'
                        : 'bg-red-100 dark:bg-red-900'
            }`}>
                <h2 className={`text-3xl font-bold ${
                    isTie
                        ? 'text-gray-700 dark:text-gray-300'
                        : didWin
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-red-700 dark:text-red-300'
                }`}>
                    {isTie ? "It's a Tie!" : didWin ? 'You Win!' : 'You Lose!'}
                </h2>
                {opponentDisconnected && (
                    <p className="text-sm text-gray-500 mt-2">
                        Opponent disconnected from the race
                    </p>
                )}
            </div>

            {/* Results Table */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-2">Player</th>
                            <th className="text-right py-2">WPM</th>
                            <th className="text-right py-2">Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-gray-100 dark:border-gray-700">
                            <td className="py-3 font-medium">{myUsername} (You)</td>
                            <td className="text-right py-3">{myWpm}</td>
                            <td className="text-right py-3">
                                {isTie ? (
                                    <span className="text-gray-500">Tie</span>
                                ) : didWin ? (
                                    <span className="text-green-500">Winner</span>
                                ) : (
                                    <span className="text-red-500">-</span>
                                )}
                            </td>
                        </tr>
                        <tr>
                            <td className={`py-3 font-medium ${opponentDisconnected ? 'text-gray-400' : ''}`}>
                                {opponentUsername}
                                {opponentDisconnected && ' (DNF)'}
                            </td>
                            <td className={`text-right py-3 ${opponentDisconnected ? 'text-gray-400' : ''}`}>
                                {opponentDisconnected ? '-' : opponentWpm}
                            </td>
                            <td className="text-right py-3">
                                {opponentDisconnected ? (
                                    <span className="text-gray-400">DNF</span>
                                ) : isTie ? (
                                    <span className="text-gray-500">Tie</span>
                                ) : !didWin ? (
                                    <span className="text-green-500">Winner</span>
                                ) : (
                                    <span className="text-red-500">-</span>
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4">
                <button
                    onClick={onRaceAgain}
                    className="bg-black dark:bg-white text-white dark:text-black font-bold py-3 px-8 rounded-full hover:opacity-80 transition-opacity"
                >
                    Race Again
                </button>
                <button
                    onClick={onLeave}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                    Back to Solo Race
                </button>
            </div>
        </div>
    );
}
