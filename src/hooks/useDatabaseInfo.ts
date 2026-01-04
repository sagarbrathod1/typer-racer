import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { UserModel } from '@/types/models';

const useDatabaseInfo = () => {
    const corpus = useQuery(api.corpus.getCorpus);

    return {
        words: corpus?.words || '',
        sagarWpm: corpus?.sagar_wpm || [],
        leaderboard: corpus?.leaderboard || [],
        loading: corpus === undefined,
    };
};

export default useDatabaseInfo;
