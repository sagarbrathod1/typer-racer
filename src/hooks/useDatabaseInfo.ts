import { Database } from '@/services/db';
import { TyperRacerModel, UserModel } from '@/types/models';
import { useCallback, useEffect, useState } from 'react';

const CORPUS_TABLE_NAME: string = 'corpus';
const CORPUS_COLUMN_NAMES: string = 'words,sagar_wpm,leaderboard';

const useDatabaseInfo = () => {
    const [words, setWords] = useState<string>('');
    const [sagarWpm, setSagarWpm] = useState<string[]>([]);
    const [leaderboard, setLeaderboard] = useState<UserModel[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchData = useCallback(async (): Promise<void> => {
        const data = (await Database.getInstance().getRecords(
            CORPUS_TABLE_NAME,
            CORPUS_COLUMN_NAMES
        )) as TyperRacerModel[];

        const [info] = data;

        setWords(info?.words);
        setSagarWpm(info?.sagar_wpm);
        setLeaderboard(info?.leaderboard);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        words,
        sagarWpm,
        leaderboard,
        loading,
    };
};

export default useDatabaseInfo;
