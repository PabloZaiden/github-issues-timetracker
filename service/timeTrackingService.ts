import { TimeTracking } from './timeTrackingService';
export default class TimeTrackingService {
    constructor() {

    }

    getTimeTracking(issueId: string): TimeTracking {
        return {
            issueId: undefined,
            estimates: [],
            dedicatedEffort: []
        }
    }

    setTimeTracking(timeTracking: TimeTracking): void {

    }
}

export interface TimeTracking {
    issueId: string,
    estimates: Effort[],
    dedicatedEffort: Effort[]
}

export interface Effort {
    date: Date,
    amount: number
}