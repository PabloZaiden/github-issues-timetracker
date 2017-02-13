import * as Redis from "redis";
import Async from "lagash-async";
import Config from "lagash-config";
import Logger from "lagash-logger";

export default class RedisService {
    private host: string;
    private port: number;
    private db: number;
    private client: Redis.RedisClient;

    constructor(db?: number, host?: string, port?: number) {
        this.host = host || Config.get("redisHost") || "localhost";
        this.port = port || Config.getAs<number>("redisPort") || 6379;
        this.db = db || 0;
    }

    async get(key: string) {
        try {
            let client = await this.getClient();
            return await Async.promise<string, string>(client.get, client)(key);
        } catch (err) {
            (new Logger("wredis")).error(err);
            return undefined;
        }
    }

    async set(key: string, value: string) {
        try {
            let client = await this.getClient();
            await Async.promise<string, string, void>(client.set, client)(key, value);
        } catch (err) {
            (new Logger("wredis")).error(err);
        }
    }

    async del(key: string) {
        let client = await this.getClient();
        await Async.promise<string, void>(client.del, client)(key);
    }

    async getListLength(key: string) {
        let client = await this.getClient();
        return Async.promise<string, number>(client.llen, client)(key);
    }

    async getList(key: string) {
        let length = await this.getListLength(key);
        let client = await this.getClient();
        let payload = await Async.promise<string, number, number, any[]>(client.lrange, client)(key, 0, length);
        return payload.map(p => {
            return JSON.parse(p);
        });
    }

    async getListElement(key: string, index: number) {
        let client = await this.getClient();
        let payload = await Async.promise<string, number, string>(client.lindex, client)(key, index);
        return JSON.parse(payload);
    }

    async addToList(key: string, item: any) {
        let client = await this.getClient();
        return Async.promise<string, string, void>(client.lpush, client)(key, JSON.stringify(item));
    }

    async removeFromList(key: string, index: number) {
        let client = await this.getClient();
        let payload = await Async.promise<string, number, string>(client.lindex, client)(key, index);

        return Async.promise<string, number, string, void>(client.lrem, client)(key, -1, payload);
    }

    private getClient(): Promise<Redis.RedisClient> {
        return new Promise<Redis.RedisClient>(async (resolve, reject) => {
            if (this.client != undefined && this.client.connected) {
                resolve(this.client);
            } else {
                this.client = Redis.createClient(this.port, this.host);
                this.client.on("ready", () => {
                    Async.promise<number, void>(this.client.select, this.client)(this.db).then(() => {
                        resolve(this.client);
                    }).catch((err) => {
                        this.client = undefined;
                        reject(err);
                    });
                }).on("error", (err: any) => {
                    this.client = undefined;
                    reject(err);
                }).on("end", () => {
                    this.client = undefined;
                });
            }
        });
    }

}