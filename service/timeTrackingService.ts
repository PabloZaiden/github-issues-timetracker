import { TimeTracking } from "./../models/api";
import RedisService from "./redisService";
import Utils from "../utils"; 

export default class TimeTrackingService {
    constructor() {
        if (TimeTrackingService.redisClient == undefined) {
            TimeTrackingService.redisClient = new RedisService();
        }
    }

    private static redisClient: RedisService;

    async getTimeTracking(issueId: string) {
        let estimates = Utils.Effort.parseArray(await TimeTrackingService.redisClient.getList(`${issueId}-estimates`));
        let dedicatedEffort = Utils.Effort.parseArray(await TimeTrackingService.redisClient.getList(`${issueId}-dedicated`));

        return {
            issueId: issueId,
            estimates: estimates,
            dedicatedEffort: dedicatedEffort
        } as TimeTracking;

    }

    async addEstimate(issueId: string, amount: number, user: string) {
        return this.addToList(`${issueId}-estimates`, amount, user);
    }

    async addDedicatedEffort(issueId: string, amount: number, user: string) {
        return this.addToList(`${issueId}-dedicated`, amount, user);
    }

    private async addToList(listName: string, amount: number, user: string) {
        let redis = new RedisService();
        return redis.addToList(listName, { date: new Date(), amount: amount, user });
    }
}