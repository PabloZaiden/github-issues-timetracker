import { TimeTracking, TimeTrackingService } from "./../service/timeTrackingService";
export class Utils {
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
}

export class IssueTimeTrackingData {
    timeTracking: TimeTracking;
    currentEstimate: number;
    totalEffort: number;

    static areEqual(e1: IssueTimeTrackingData, e2: IssueTimeTrackingData) {
        if (!TimeTracking.areEqual(e1.timeTracking, e2.timeTracking)) {
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