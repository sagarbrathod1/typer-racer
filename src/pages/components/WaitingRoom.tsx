import { useState } from 'react';

type Props = {
    roomCode: string;
    isHost: boolean;
    opponentUsername?: string;
    onStartRace: () => void;
    onLeave: () => void;
};

export default function WaitingRoom({
    roomCode,
    isHost,
    opponentUsername,
    onStartRace,
    onLeave,
}: Props) {
    const [copied, setCopied] = useState(false);

    const copyCode = async () => {
        await navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold">Waiting Room</h2>

            {/* Room Code Display */}
            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Share this code with your friend:
                </p>
                <div className="flex items-center justify-center gap-4">
                    <span className="text-4xl font-mono font-bold tracking-widest">
                        {roomCode}
                    </span>
                    <button
                        onClick={copyCode}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Copy code"
                    >
                        {copied ? (
                            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Players */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Players</h3>
                <div className="flex flex-col gap-2">
                    {/* Host */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            {isHost ? 'You (Host)' : 'Host'}
                        </span>
                        {isHost && <span className="text-xs text-gray-500">Ready</span>}
                    </div>

                    {/* Guest */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="flex items-center gap-2">
                            {opponentUsername ? (
                                <>
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    {opponentUsername}
                                </>
                            ) : (
                                <>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
                                    <span className="text-gray-400">Waiting for opponent...</span>
                                </>
                            )}
                        </span>
                        {opponentUsername && <span className="text-xs text-gray-500">Ready</span>}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4">
                {isHost && (
                    <button
                        onClick={onStartRace}
                        disabled={!opponentUsername}
                        className="bg-black dark:bg-white text-white dark:text-black font-bold py-3 px-8 rounded-full hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {opponentUsername ? 'Start Race' : 'Waiting for opponent...'}
                    </button>
                )}
                {!isHost && (
                    <p className="text-gray-500 dark:text-gray-400">
                        Waiting for host to start the race...
                    </p>
                )}
                <button
                    onClick={onLeave}
                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                >
                    Leave Room
                </button>
            </div>
        </div>
    );
}
