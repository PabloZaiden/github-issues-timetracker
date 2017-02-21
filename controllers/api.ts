import { TimeTracking } from "./../service/timeTrackingService";
import { Utils, IssueTimeTrackingData } from "./utils";
import LagashLogger from "lagash-logger";
import { TimeTrackingService } from "../service/timeTrackingService";
import { DocController, DocAction, Get, Post, Context, ActionMiddleware, Controller } from "kwyjibo";
import * as K from "kwyjibo";
import App from "../app";
import GithubService from "../service/githubService";

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
        @K.FromQuery("org") orgName: string) {

        let gh = new GithubService(API.getToken(context));

        let repos = await gh.getRepos(orgName);

        return repos;
    }

    @K.Get()
    async issues(
        context: Context,
        @K.FromQuery("org") org: string,
        @K.FromQuery("repo") repo: string) {

        let gh = new GithubService(API.getToken(context));

        let issues = await gh.getIssues(org, repo);

        return issues;
    }

    @K.Get()
    async milestones(
        context: Context,
        @K.FromQuery("org") org: string,
        @K.FromQuery("repo") repo: string,
        @K.FromQuery("state") state?: string) {

        // VALIDATE: query.state

        let gh = new GithubService(API.getToken(context));

        if (state == undefined) {
            state = "all";
        }

        if (state !== "all" && state !== "open" && state !== "closed") {
            throw new Error("Invalid state");
        }

        let milestones = await gh.getMilestones(org, repo, state);

        return milestones;
    }

    @K.Post("issue/:issueId/effort")
    async effort(
        context: Context,
        @K.FromPath("issueId") issueId: string,
        @K.FromBody() body: any) {

        // VALIDATE: body.amount

        let timeTracking = new TimeTrackingService();
        let amount = parseInt(body.amount);
        if (!amount || isNaN(amount) || amount < 1) {
            throw new Error("Amount must be a positive integer");
        }

        let gh = new GithubService(API.getToken(context));

        let user = await gh.getCurrentUser();



        await timeTracking.addDedicatedEffort(issueId, amount, user.login);

        context.response.sendStatus(200);
    }

    @K.Post("/issue/:issueId/estimate")
    async estimate(
        context: Context,
        @K.FromPath("issueId") issueId: string,
        @K.FromBody() body: any) {


        // VALIDATE: body.amount

        let timeTracking = new TimeTrackingService();
        let amount = parseInt(body.amount);
        if (!amount || isNaN(amount) || amount < 1) {
            throw new Error("Amount must be a positive integer");
        }

        let gh = new GithubService(API.getToken(context));

        let user = await gh.getCurrentUser();

        await timeTracking.addEstimate(issueId, amount, user.login);

        context.response.sendStatus(200);
    }

    @K.Get("/issue/:issueId/timeTracking")
    async timeTracking(
        context: Context,
        @K.FromPath("issueId") issueId: string) {

        let timeTracking = new TimeTrackingService();

        return timeTracking.getTimeTracking(issueId);
    }

    @K.Get("/timeTrackingPerDayByMilestone")
    async getTimeTrackingPerDayByMilestone(
        context: Context,
        @K.FromQuery("org") org: string,
        @K.FromQuery("repo") repo: string,
        @K.FromQuery("number") number: string) {

        // VALIDATE: number

        // TODO: Fix this. It's not working

        let gh = new GithubService(API.getToken(context));
        let tt = new TimeTrackingService();

        let milestone = await gh.getMilestone(org, repo, parseInt(number));
        let issues = await gh.getIssuesByMilestone(org, repo, milestone.number, { state: "all" });

        let limitDate: Date;
        if (milestone.closed_at != undefined) {
            limitDate = milestone.closed_at;
        } else {
            limitDate = new Date();
        }

        limitDate.setDate(limitDate.getDate() + 1);

        let startingDate: Date = milestone.created_at;
        let estimatesByDate: K.Dictionary<K.Dictionary<IssueTimeTrackingData>> = {};

        for (let issue of issues) {
            let current = new Date(startingDate.getFullYear(), startingDate.getMonth(), startingDate.getDate());
            current.setDate(current.getDate() + 1);
            let last: IssueTimeTrackingData;

            while (current < limitDate) {
                let key = current.toISOString();

                let newTimeTrackingData = await Utils.getIssueTimeTrackingDataUpToDate(issue.id, current);

                if (last == undefined || !IssueTimeTrackingData.areEqual(last, newTimeTrackingData)) {
                    if (estimatesByDate[key] == undefined) {
                        estimatesByDate[key] = {};
                    }
                    estimatesByDate[key]["issue-" + issue.id] = newTimeTrackingData;
                }

                last = newTimeTrackingData;
                current.setDate(current.getDate() + 1);
            }
        }

        return estimatesByDate;
    }

    @K.Get()
    async user(context: Context) {
        let gh = new GithubService(API.getToken(context));

        let user = await gh.getCurrentUser();

        return user;
    }
}