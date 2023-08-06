import { LeaderboardDatabaseModel, TyperRacerModel } from '@/types/models';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IDatabase } from './idb';

type GeneralModel = TyperRacerModel | LeaderboardDatabaseModel;

export class Database implements IDatabase<GeneralModel> {
    private _client: SupabaseClient<TyperRacerModel> | undefined = undefined;
    private static _instance: Database;

    private constructor() {
        this._client = createClient<GeneralModel>(
            process.env.NEXT_PUBLIC_SUPABASE_URL as string,
            process.env.NEXT_PUBLIC_SUPABASE_API_KEY as string
        );
    }

    public async getRecords(tableName: string, column: string): Promise<GeneralModel[]> {
        if (!this._client) {
            return [];
        }

        const { data } = await this._client.from(tableName).select(column);

        if (data) {
            // @ts-ignore
            return data as GeneralModel[];
        }

        return [];
    }

    public static getInstance(): Database {
        if (!Database._instance) {
            this._instance = new Database();
        }

        return this._instance;
    }

    public async updateRecord(
        tableName: string,
        newValue: GeneralModel,
        whereValueToFind: string,
        whereColumnName: string
    ): Promise<GeneralModel | undefined> {
        if (!this._client) {
            return undefined;
        }

        const { data } = await this._client
            .from(tableName)
            .update(newValue)
            .eq(whereColumnName, whereValueToFind);

        return newValue;
    }

    public async createRecord(
        tableName: string,
        newValue: GeneralModel
    ): Promise<GeneralModel | undefined> {
        if (!this._client) {
            return undefined;
        }

        const { data } = await this._client.from(tableName).insert(newValue);

        return data === null ? undefined : data;
    }
}
