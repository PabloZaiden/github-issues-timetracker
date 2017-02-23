import { TimeTracking } from "./../models/api";
import RedisService from "./redisService";
import Utils from "../utils";

export default class TimeTrackingService {
    private static estimatesListName = "estimates";
    private static dedicatedEffortListName = "dedicated";
    private static redisClient: RedisService;

    constructor() {
        if (TimeTrackingService.redisClient == undefined) {
            TimeTrackingService.redisClient = new RedisService();
        }
    }


    async getTimeTracking(issueId: string) {
        let estimates = Utils.Effort.parseArray(await TimeTrackingService.redisClient.getList(`${issueId}-${TimeTrackingService.estimatesListName}`));
        let dedicatedEffort = Utils.Effort.parseArray(await TimeTrackingService.redisClient.getList(`${issueId}-${TimeTrackingService.dedicatedEffortListName}`));

        return {
            issueId: issueId,
            estimates: estimates,
            dedicatedEffort: dedicatedEffort
        } as TimeTracking;

    }

    async addEstimate(issueId: string, amount: number, user: string) {
        return this.addToList(issueId, TimeTrackingService.estimatesListName, amount, user);
    }

    async addDedicatedEffort(issueId: string, amount: number, user: string) {
        return this.addToList(issueId, TimeTrackingService.dedicatedEffortListName, amount, user);
    }

    async removeDedicatedEffort(issueId: string, amount: number, user: string) {
        return this.removeFromList(issueId, TimeTrackingService.dedicatedEffortListName, amount, user);
    }

    async removeEstimate(issueId: string, amount: number, user: string) {
        return this.removeFromList(issueId, TimeTrackingService.estimatesListName, amount, user);
    }

    private async removeFromList(issueId: string, listName: string, amount: number, user: string) {
        let list = Utils.Effort.parseArray(await TimeTrackingService.redisClient.getList(`${issueId}-${listName}`));

        let index = list.findIndex((effort) => {
            return effort.user === user && effort.amount === amount
        });

        if (index >= 0) {
            return TimeTrackingService.redisClient.removeFromList(`${issueId}-${listName}`, index);
        }
    }

    private async addToList(issueId: string, listName: string, amount: number, user: string) {
        return TimeTrackingService.redisClient.addToList(`${issueId}-${listName}`, { date: new Date(), amount: amount, user });
    }
}