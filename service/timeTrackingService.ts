import RedisService from "./redisService";

export class TimeTrackingService {
    constructor() {
        if (TimeTrackingService.redisClient == undefined) {
            TimeTrackingService.redisClient = new RedisService();
        }
    }

    private static redisClient: RedisService;

    async getTimeTracking(issueId: string) {
        let estimates = Effort.parseArray(await TimeTrackingService.redisClient.getList(`${issueId}-estimates`));
        let dedicatedEffort = Effort.parseArray(await TimeTrackingService.redisClient.getList(`${issueId}-dedicated`));

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

export class TimeTracking {
    issueId: string;
    estimates: Effort[];
    dedicatedEffort: Effort[];

    static areEqual(tt1: TimeTracking, tt2: TimeTracking) {
        if (tt1.issueId != tt2.issueId) {
            return false;
        }

        if (tt1.estimates.length != tt2.estimates.length) {
            return false;
        }

        if (tt1.dedicatedEffort.length != tt2.dedicatedEffort.length) {
            return false;
        }

        for (let i = 0; i < tt1.dedicatedEffort.length; i++) {
            if (!Effort.areEqual(tt1.dedicatedEffort[i], tt2.dedicatedEffort[i])) {
                return false;
            }
        }

        for (let i = 0; i < tt1.estimates.length; i++) {
            if (!Effort.areEqual(tt1.estimates[i], tt2.estimates[i])) {
                return false;
            }
        }

        return true;
    }
}

export class Effort {
    date: Date;
    amount: number;
    user: string;

    static parseArray(arr: any[]) {
        return arr.map(e => {
            return {
                date: new Date(e.date),
                amount: e.amount,
                user: e.user
            } as Effort;
        });
    }

    static areEqual(e1: Effort, e2: Effort) {
        if (e1.date != e2.date) {
            return false;
        }

        if (e1.amount != e2.amount) {
            return false;
        }

        if (e1.user != e2.user) {
            return false;
        }

        return true;
    }
}