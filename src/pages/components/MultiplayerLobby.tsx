import { useState } from 'react';

type Props = {
    onCreateRoom: () => void;
    onJoinRoom: (code: string) => void;
    onBack: () => void;
};

export default function MultiplayerLobby({ onCreateRoom, onJoinRoom, onBack }: Props) {
    const [showJoinInput, setShowJoinInput] = useState(false);
    const [joinCode, setJoinCode] = useState('');

    const handleJoinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (joinCode.trim().length === 6) {
            onJoinRoom(joinCode.trim());
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-bold mb-8">Multiplayer Race</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
                Race against a friend in real-time!
            </p>

            {!showJoinInput ? (
                <div className="space-y-4">
                    <button
                        onClick={onCreateRoom}
                        className="w-full max-w-xs mx-auto block bg-black dark:bg-white text-white dark:text-black font-bold py-4 px-8 rounded-full hover:opacity-80 transition-opacity"
                    >
                        Create Room
                    </button>
                    <button
                        onClick={() => setShowJoinInput(true)}
                        className="w-full max-w-xs mx-auto block border-2 border-black dark:border-white text-black dark:text-white font-bold py-4 px-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        Join Room
                    </button>
                    <button
                        onClick={onBack}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-4"
                    >
                        Back to Solo Race
                    </button>
                </div>
            ) : (
                <form onSubmit={handleJoinSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Enter Room Code
                        </label>
                        <input
                            type="text"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                            placeholder="ABC123"
                            className="w-full max-w-xs mx-auto block text-center text-2xl tracking-widest py-3 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:border-black dark:focus:border-white"
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-4 justify-center">
                        <button
                            type="button"
                            onClick={() => {
                                setShowJoinInput(false);
                                setJoinCode('');
                            }}
                            className="border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold py-2 px-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={joinCode.length !== 6}
                            className="bg-black dark:bg-white text-white dark:text-black font-bold py-2 px-6 rounded-full hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Join
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
