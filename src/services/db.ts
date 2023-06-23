import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IDatabase } from './idb';
import { TyperRacerModel } from '@/types/models';

export class Database implements IDatabase<TyperRacerModel> {
    private _client: SupabaseClient<TyperRacerModel> | undefined = undefined;
    private static _instance: Database;

    private constructor() {
        this._client = createClient<TyperRacerModel>(
            process.env.NEXT_PUBLIC_SUPABASE_URL as string,
            process.env.NEXT_PUBLIC_SUPABASE_API_KEY as string
        );
    }

    public async getRecords(tableName: string, column: string): Promise<TyperRacerModel[]> {
        if (!this._client) {
            return [];
        }

        const { data } = await this._client.from(tableName).select(column);

        if (data) {
            // @ts-ignore
            return data as TyperRacerModel[];
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
        newValue: TyperRacerModel
    ): Promise<TyperRacerModel | undefined> {
        if (!this._client) {
            return undefined;
        }

        const { data } = await this._client.from(tableName).update(newValue);

        return newValue;
    }
}
