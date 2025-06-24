import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { UserModel } from '@/types/models';
import { useCallback, useMemo } from 'react';

type UseLeaderboardDatabaseInfoParams = {
    userId: string;
    username: string;
    email?: string;
};

export type UseLeaderboardDatabaseInfo = {
    loading: boolean;
    saveScore: (value: number, callback: () => void) => Promise<void>;
    getLeaderboard: () => UserModel[];
};

const useLeaderboardDatabaseInfo = ({
    userId,
    username,
    email,
}: UseLeaderboardDatabaseInfoParams): UseLeaderboardDatabaseInfo => {
    const leaderboard = useQuery(api.leaderboard.getLeaderboard);
    const createUser = useMutation(api.leaderboard.createUser);
    const updateUserScores = useMutation(api.leaderboard.updateUserScores);
    const currentUser = useQuery(api.leaderboard.getUserByUserId, userId ? { userId } : "skip");

    const saveScore = useCallback(
        async (value: number, callback: () => void): Promise<void> => {
            if (!userId || !username) return;

            try {
                if (!currentUser) {
                    await createUser({
                        userId,
                        username,
                        email,
                        initialScore: value,
                    });
                } else {
                    await updateUserScores({
                        userId,
                        newScore: value,
                    });
                }
                callback();
            } catch (error) {
                console.error('Error saving score:', error);
            }
        },
        [userId, username, email, currentUser, createUser, updateUserScores]
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
