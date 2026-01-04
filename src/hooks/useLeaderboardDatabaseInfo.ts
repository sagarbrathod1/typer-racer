import { useQuery, useMutation } from 'convex/react';
import { useConvexAuth } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { UserModel } from '@/types/models';
import { useCallback, useMemo } from 'react';

export type UseLeaderboardDatabaseInfo = {
    loading: boolean;
    saveScore: (value: number, callback: () => void) => Promise<void>;
    getLeaderboard: () => UserModel[];
};

const useLeaderboardDatabaseInfo = (): UseLeaderboardDatabaseInfo => {
    const { isAuthenticated } = useConvexAuth();
    const leaderboard = useQuery(api.leaderboard.getLeaderboard);
    const createUser = useMutation(api.leaderboard.createUser);
    const updateUserScores = useMutation(api.leaderboard.updateUserScores);

    const saveScore = useCallback(
        async (value: number, callback: () => void): Promise<void> => {
            if (!isAuthenticated) return;

            try {
                // Try to update existing user first, create if not found
                try {
                    await updateUserScores({ newScore: value });
                } catch {
                    // User doesn't exist yet, create them
                    await createUser({ initialScore: value });
                }
                callback();
            } catch (error) {
                console.error('Error saving score:', error);
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
