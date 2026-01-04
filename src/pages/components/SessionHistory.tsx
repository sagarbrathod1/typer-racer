import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

type Props = {
    userId: string;
    theme: string | undefined;
};

const SessionHistory = ({ userId, theme }: Props) => {
    const sessions = useQuery(api.sessions.getUserSessions, { userId });
    const stats = useQuery(api.sessions.getUserStats, { userId });

    if (!sessions || sessions.length === 0) {
        return null;
    }

    const isDark = theme === 'dark';

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Your Stats</h3>

            {stats && (
                <div className={`grid grid-cols-2 gap-3 mb-4 p-4 rounded-lg ${
                    isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                    <div className="text-center">
                        <div className="text-2xl font-bold">{stats.bestWpm}</div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Best WPM
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold">{stats.averageWpm}</div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Avg WPM
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold">{stats.totalRaces}</div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Total Races
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold">{stats.averageAccuracy}</div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Avg Accuracy
                        </div>
                    </div>
                </div>
            )}

            <h4 className="text-sm font-medium mb-2">Recent Races</h4>
            <div className={`rounded-lg overflow-hidden border ${
                isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
                <table className="w-full text-sm">
                    <thead className={isDark ? 'bg-gray-800' : 'bg-gray-100'}>
                        <tr>
                            <th className="py-2 px-3 text-left">WPM</th>
                            <th className="py-2 px-3 text-left">Accuracy</th>
                            <th className="py-2 px-3 text-right">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map((session, i) => (
                            <tr
                                key={session._id}
                                className={`border-t ${
                                    isDark ? 'border-gray-700' : 'border-gray-200'
                                } ${i % 2 === 0 ? '' : isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}
                            >
                                <td className="py-2 px-3 font-medium">{session.wpm}</td>
                                <td className="py-2 px-3">{session.accuracy.toFixed(2)}</td>
                                <td className={`py-2 px-3 text-right ${
                                    isDark ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                    {new Date(session.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SessionHistory;
