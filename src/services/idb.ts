export interface IDatabase<T> {
    getRecords: (tableName: string, column: string) => Promise<T[]>;
    updateRecord: (tableName: string, newValue: T) => Promise<T | undefined>;
}
