import RedisService from "./redisService";
export default class TimeTrackingService {
    constructor() {

    }

    async getTimeTracking(issueId: string) {
        let redis = new RedisService();
        let estimates : Effort[] = await redis.getList(`${issueId}-estimates`);
        let dedicatedEffort : Effort[] = await redis.getList(`${issueId}-dedicated`);
        
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
        return redis.addToList(listName, {date: new Date(), amount: amount, user});
    }
}

export interface TimeTracking {
    issueId: string,
    estimates: Effort[],
    dedicatedEffort: Effort[]
}

export interface Effort {
    date: Date,
    amount: number,
    user: string
}