import { IssueTimeTrackingData, Effort, TimeTracking } from "./models/api";
import TimeTrackingService from "./service/timeTrackingService";

export default class Utils {
    static sum(n1: number, n2: number) {
        return n1 + n2;
    }

    static async getIssueTimeTrackingDataUpToDate(issueId: string, date: Date) {
        let timeTrackingService = new TimeTrackingService();
        let timeTracking = await timeTrackingService.getTimeTracking(issueId);

        if (date != undefined) {
            timeTracking.estimates = timeTracking.estimates.filter(e => {
                return e.date < date;
            });

            timeTracking.dedicatedEffort = timeTracking.dedicatedEffort.filter(e => {
                return e.date < date;
            });
        }

        let currentEstimate = 0;
        if (timeTracking.estimates.length > 0) {
            currentEstimate = timeTracking.estimates[0].amount;
        }

        let totalEffort = 0;
        if (timeTracking.dedicatedEffort.length > 0) {
            totalEffort = timeTracking.dedicatedEffort.map((e) => e.amount).reduce(Utils.sum);
        }

        return {
            timeTracking: timeTracking,
            currentEstimate: currentEstimate,
            totalEffort: totalEffort
        } as IssueTimeTrackingData;
    }

    static async getIssueTimeTrackingData(issueId: string) {
        return Utils.getIssueTimeTrackingDataUpToDate(issueId, undefined);
    }

    static IssueTimeTrackingData = {
        areEqual(e1: IssueTimeTrackingData, e2: IssueTimeTrackingData) {
            if (!Utils.TimeTracking.areEqual(e1.timeTracking, e2.timeTracking)) {
                return false;
            }

            if (e1.currentEstimate != e2.currentEstimate) {
                return false;
            }

            if (e1.totalEffort != e2.totalEffort) {
                return false;
            }

            return true;
        }
    }

    static TimeTracking = {
        areEqual(tt1: TimeTracking, tt2: TimeTracking) {
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
                if (!Utils.Effort.areEqual(tt1.dedicatedEffort[i], tt2.dedicatedEffort[i])) {
                    return false;
                }
            }

            for (let i = 0; i < tt1.estimates.length; i++) {
                if (!Utils.Effort.areEqual(tt1.estimates[i], tt2.estimates[i])) {
                    return false;
                }
            }

            return true;
        }
    }

    static Effort = {
        parseArray(arr: any[]) {
            return arr.map(e => {
                return {
                    date: new Date(e.date),
                    amount: e.amount,
                    user: e.user
                } as Effort;
            });
        },

        areEqual(e1: Effort, e2: Effort) {
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
}
