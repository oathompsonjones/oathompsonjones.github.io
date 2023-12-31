import type { Collection, Db } from "mongodb";
import Config from "config";
import { CronJob } from "cron";
import { MongoClient } from "mongodb";

export enum LogLevel {
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
    DEBUG = "DEBUG"
}

export interface ILog {
    content: string;
    level: LogLevel;
    production: boolean;
    timestamp: number;
}

export async function init(): Promise<[Collection<ILog>, () => void]> {
    const mongoClient: MongoClient = new MongoClient(Config.databaseURL);
    await mongoClient.connect();
    const database: Db = mongoClient.db("Logs");
    const logsCollection: Collection<ILog> = database.collection("Logs");
    return [logsCollection, (): void => void mongoClient.close()];
}

void new CronJob("0 0 1 * *", async () => void await init(), null, true, "utc");