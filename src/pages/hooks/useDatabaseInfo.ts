import { Database } from '@/services/db';
import { useCallback, useEffect, useState } from 'react';

const TABLE_NAME: string = 'corpus';
const COLUMN_NAMES: string = 'words,sagar_wpm';

const useDatabaseInfo = () => {
    const [words, setWords] = useState<string>('');
    const [sagarWpm, setSagarWpm] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchData = useCallback(async (): Promise<void> => {
        const data = await Database.getInstance().getRecords(TABLE_NAME, COLUMN_NAMES);

        const [info] = data;

        setWords(info.words);
        setSagarWpm(info.sagar_wpm);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        data: {
            words,
            sagarWpm,
            loading,
        },
    };
};

export default useDatabaseInfo;
