import * as Express from "express";
let APICache = require("apicache");

export default class CacheService {
    static Default: Express.RequestHandler;
    static Eternal: Express.RequestHandler;
    static Short: Express.RequestHandler;
    static Long: Express.RequestHandler;

    static init() {
        if (CacheService.Default == undefined) {
            CacheService.Default = APICache.middleware("60 minutes");
            CacheService.Eternal = APICache.middleware("365 days");
            CacheService.Short = APICache.middleware("60 seconds");
            CacheService.Long = APICache.middleware("24 hours");
        }
    }
}

CacheService.init();