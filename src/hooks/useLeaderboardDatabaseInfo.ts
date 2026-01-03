import { useQuery, useMutation } from 'convex/react';
import { useConvexAuth } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { UserModel, GameResult } from '@/types/models';
import { useCallback, useMemo } from 'react';

export type UseLeaderboardDatabaseInfo = {
    loading: boolean;
    saveScore: (gameResult: GameResult, callback: () => void) => Promise<void>;
    getLeaderboard: () => UserModel[];
};

const useLeaderboardDatabaseInfo = (): UseLeaderboardDatabaseInfo => {
    const { isAuthenticated } = useConvexAuth();
    const leaderboard = useQuery(api.leaderboard.getLeaderboard);
    const createUser = useMutation(api.leaderboard.createUser);
    const updateUserScores = useMutation(api.leaderboard.updateUserScores);

    const saveScore = useCallback(
        async (gameResult: GameResult, callback: () => void): Promise<void> => {
            if (!isAuthenticated) return;

            try {
                try {
                    await updateUserScores({ gameResult });
                } catch {
                    await createUser({ gameResult });
                }
                callback();
            } catch (error) {
                console.error('Error saving score:', error);
                throw error;
            }
        },
        [isAuthenticated, createUser, updateUserScores]
    );

    const getLeaderboard = useMemo(() => {
        if (!leaderboard) return [];

        const listToDisplay: UserModel[] = leaderboard.map((item) => {
            const maxValue = item.scores.reduce((a, b) => Math.max(a, b), -Infinity);
            return {
                user: item.username,
                adjusted_wpm: maxValue,
            };
        });

        listToDisplay.sort((a, b) => (a.adjusted_wpm < b.adjusted_wpm ? 1 : -1));
        return listToDisplay;
    }, [leaderboard]);

    return {
        loading: leaderboard === undefined,
        saveScore,
        getLeaderboard: () => getLeaderboard,
    };
};

export default useLeaderboardDatabaseInfo;
