import Utils from "../utils";
import { DayEntry, IssueTimeTrackingData, AmountPayload } from "../models/api";
import LagashLogger from "lagash-logger";
import TimeTrackingService from "../service/timeTrackingService";
import { DocController, DocAction, Get, Post, Context, ActionMiddleware, Controller } from "kwyjibo";
import * as K from "kwyjibo";
import App from "../app";
import GithubService from "../service/githubService";
import * as TomCollins from "tom-collins";

@K.Middleware(App.authorize)
@Controller("/api")
@DocController("API Controller")
export default class API {

    private static logger: LagashLogger;

    constructor() {
        API.logger = new LagashLogger("API");
    }

    static getToken(context: Context): string {
        let authHeader = context.request.headers["Authorization"];
        let token: string = undefined;
        if (authHeader != undefined && authHeader.startsWith("bearer ")) {
            token = authHeader.substring("bearer ".length);
        }

        if (!token) {
            token = context.request.user.accessToken;
        }

        return token;
    }

    @K.Get()
    async organizations(context: Context) {
        let gh = new GithubService(API.getToken(context));

        let orgs = await gh.getOrganizations();

        return orgs;
    }

    @K.Get()
    async repos(
        context: Context,
        @K.FromQuery("org") org: string) {

        TomCollins.parseString(org, Utils.Validations.notEmpty);

        let gh = new GithubService(API.getToken(context));

        let repos = await gh.getRepos(org);

        return repos;
    }

    @K.Get()
    async issues(
        context: Context,
        @K.FromQuery("org") org: string,
        @K.FromQuery("repo") repo: string) {

        TomCollins.parseString(org, Utils.Validations.notEmpty);
        TomCollins.parseString(repo, Utils.Validations.notEmpty);

        let gh = new GithubService(API.getToken(context));

        let issues = await gh.getIssues(org, repo);

        return issues;
    }

    @K.Get()
    async milestones(
        context: Context,
        @K.FromQuery("org") org: string,
        @K.FromQuery("repo") repo: string,
        @K.FromQuery("state") state?: "open" | "closed" | "all") {

        TomCollins.parseString(org, Utils.Validations.notEmpty);
        TomCollins.parseString(repo, Utils.Validations.notEmpty);
        TomCollins.parseString(state, {
            pattern: ["open", "closed", "all"],
            optional: true
        });

        let gh = new GithubService(API.getToken(context));

        let milestones = await gh.getMilestones(org, repo, state);

        return milestones;
    }

    @K.Post("issue/:issueId/effort")
    async effort(
        context: Context,
        @K.FromPath("issueId") issueId: string,
        @K.FromBody() body: any) {

        TomCollins.parseString(issueId, Utils.Validations.notEmpty);
        let payload = TomCollins.parse(AmountPayload, body);
        
        let timeTracking = new TimeTrackingService();

        let gh = new GithubService(API.getToken(context));

        let user = await gh.getCurrentUser();

        await timeTracking.addDedicatedEffort(issueId, payload.amount, user.login);

        context.response.sendStatus(200);
    }

    @K.Post("/issue/:issueId/estimate")
    async estimate(
        context: Context,
        @K.FromPath("issueId") issueId: string,
        @K.FromBody() body: any) {

        TomCollins.parseString(issueId, Utils.Validations.notEmpty);
        let payload = TomCollins.parse(AmountPayload, body);

        let timeTracking = new TimeTrackingService();

        let gh = new GithubService(API.getToken(context));

        let user = await gh.getCurrentUser();

        await timeTracking.addEstimate(issueId, payload.amount, user.login);

        context.response.sendStatus(200);
    }

    @K.Get("/issue/:issueId/timeTracking")
    async timeTracking(
        context: Context,
        @K.FromPath("issueId") issueId: string) {

        TomCollins.parseString(issueId, Utils.Validations.notEmpty);

        let timeTracking = new TimeTrackingService();

        return timeTracking.getTimeTracking(issueId);
    }

    @K.Get("/timeTrackingPerDayByMilestone")
    async timeTrackingPerDayByMilestone(
        context: Context,
        @K.FromQuery("org") org: string,
        @K.FromQuery("repo") repo: string,
        @K.FromQuery("number") numberRaw: string) {

        TomCollins.parseString(org, Utils.Validations.notEmpty);
        TomCollins.parseString(repo, Utils.Validations.notEmpty);
        let number = TomCollins.parseFloat(numberRaw, Utils.Validations.positiveNatural);

        let gh = new GithubService(API.getToken(context));
        let tt = new TimeTrackingService();

        let milestone = await gh.getMilestone(org, repo, number);
        let issues = await gh.getIssuesByMilestone(org, repo, milestone.number, { state: "all" });

        let limitDate: Date;
        if (milestone.closed_at != undefined) {
            limitDate = milestone.closed_at;
        } else {
            limitDate = new Date();
        }

        limitDate.setDate(limitDate.getDate() + 1);

        let startingDate: Date = milestone.created_at;

        let estimatesByDate: K.Dictionary<DayEntry> = {};

        for (let issue of issues) {
            let current = new Date(startingDate.getFullYear(), startingDate.getMonth(), startingDate.getDate());
            current.setDate(current.getDate() + 1);
            let last: IssueTimeTrackingData;

            while (current < limitDate) {
                let key = current.toISOString().substr(0, 10); // only get the date;

                let newTimeTrackingData = await Utils.getIssueTimeTrackingDataUpToDate(issue.id, current);

                if (last == undefined || !Utils.IssueTimeTrackingData.areEqual(last, newTimeTrackingData)) {
                    if (estimatesByDate[key] == undefined) {
                        estimatesByDate[key] = {
                            currentEstimate: 0,
                            totalEffort: 0,
                            issues: {}
                        };
                    }
                    estimatesByDate[key].issues["issue-" + issue.id] = newTimeTrackingData;

                    estimatesByDate[key].currentEstimate += newTimeTrackingData.currentEstimate;

                    estimatesByDate[key].totalEffort += newTimeTrackingData.totalEffort;
                }

                last = newTimeTrackingData;
                current.setDate(current.getDate() + 1);
            }
        }

        //order keys by date ascending
        let keys = [];
        for (let key in estimatesByDate) {
            keys.push(key);
        }

        keys.sort((a, b) => {
            let date1 = new Date(a);
            let date2 = new Date(b);

            if (date1 == date2) {
                return 0;
            } else if (date1 > date2) {
                return 1;
            } else {
                return -1;
            }
        });

        let retObj: K.Dictionary<DayEntry> = {};
        for (let key of keys) {
            retObj[key] = estimatesByDate[key];
        }

        return retObj;
    }

    @K.Get()
    async user(context: Context) {
        let gh = new GithubService(API.getToken(context));

        let user = await gh.getCurrentUser();

        return user;
    }
}