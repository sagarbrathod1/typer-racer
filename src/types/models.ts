export type TyperRacerModel = {
    words: string;
    sagar_wpm: string[];
    leaderboard: UserModel[];
};

export type UserModel = {
    user: any;
    adjusted_wpm: number;
};

export type LeaderboardModel = {
    username: string;
    scores: number[];
};

export type LeaderboardDatabaseModel = {
    username: string;
    scores: string;
};

export type GameResult = {
    startTime: number;
    endTime: number;
    charsTyped: number;
    corpusLength: number;
};
