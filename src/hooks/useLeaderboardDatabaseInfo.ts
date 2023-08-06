import { Database } from '@/services/db';
import { LeaderboardDatabaseModel, LeaderboardModel, UserModel } from '@/types/models';
import React, { useCallback, useEffect, useState } from 'react';

const LEADERBOARD_TABLE_NAME: string = 'leaderboard';
const LEADERBOARD_COLUMN_NAMES: string = 'username, scores';
const LEADERBOARD_WHERE_COLUMN_NAME: string = 'username';

type UseLeaderboardDatabaseInfoParams = {
    username: string;
};

export type UseLeaderboardDatabaseInfo = {
    loading: boolean;
    saveScore: (value: number, callback: () => void) => Promise<void>;
    getLeaderboard: () => UserModel[];
};

const useLeaderboardDatabaseInfo = ({
    username,
}: UseLeaderboardDatabaseInfoParams): UseLeaderboardDatabaseInfo => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardModel[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchLeaderboard = useCallback(async (): Promise<void> => {
        if (!username) {
            return;
        }

        setLoading(true);
        const records = (await Database.getInstance().getRecords(
            LEADERBOARD_TABLE_NAME,
            LEADERBOARD_COLUMN_NAMES
        )) as LeaderboardDatabaseModel[];

        const formattedRecords = records.map(
            (record: LeaderboardDatabaseModel): LeaderboardModel => ({
                username: record.username,
                scores: JSON.parse(record.scores) as number[],
            })
        );

        setLeaderboard(formattedRecords);
        setLoading(false);
    }, [username, setLoading]);

    const saveNewRecord = useCallback(async (username: string, score: number): Promise<void> => {
        setLoading(true);
        const newRecord: LeaderboardDatabaseModel = {
            username,
            scores: JSON.stringify([score]),
        };

        await Database.getInstance().createRecord(LEADERBOARD_TABLE_NAME, newRecord);
        setLoading(false);
    }, []);

    const updateRecord = useCallback(
        async (record: LeaderboardModel, newScore: number): Promise<void> => {
            const newScores = [...record.scores, newScore];
            newScores.sort();

            const recordToUpdate: LeaderboardDatabaseModel = {
                username: record.username,
                scores: JSON.stringify(newScores),
            };

            await Database.getInstance().updateRecord(
                LEADERBOARD_TABLE_NAME,
                recordToUpdate,
                username,
                LEADERBOARD_WHERE_COLUMN_NAME
            );
        },
        [username]
    );

    const saveScore = useCallback(
        async (value: number, callback: () => void): Promise<void> => {
            const preexistingRecord = leaderboard.find(
                (item: LeaderboardModel) => item.username === username
            );

            if (!preexistingRecord) {
                await saveNewRecord(username as string, value);
            } else {
                await updateRecord(preexistingRecord, value);
            }

            await fetchLeaderboard();
            callback();
        },
        [leaderboard, username, saveNewRecord, updateRecord, fetchLeaderboard]
    );

    const getLeaderboard = useCallback(() => {
        const listToDisplay: UserModel[] = [];

        leaderboard.forEach((item: LeaderboardModel) => {
            const maxValue = item.scores.reduce((a, b) => Math.max(a, b), -Infinity);

            listToDisplay.push({
                user: item.username,
                adjusted_wpm: maxValue,
            });
        });

        listToDisplay.sort((a, b) => (a.adjusted_wpm > b.adjusted_wpm ? 1 : -1));
        return listToDisplay;
    }, [leaderboard]);

    useEffect(() => {
        fetchLeaderboard();

        const intervalId = setInterval(() => fetchLeaderboard(), 300000);

        return () => {
            clearInterval(intervalId);
        };
    }, []);

    return {
        loading,
        saveScore,
        getLeaderboard,
    };
};

export default useLeaderboardDatabaseInfo;
