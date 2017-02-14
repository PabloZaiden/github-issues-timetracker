import TimeTrackingService from "../service/timeTrackingService";
import { DocController, DocAction, Get, Post, Context, ActionMiddleware, Controller } from "kwyjibo";
import * as K from "kwyjibo";
import App from "../app";
import GithubService from "../service/githubService";

@K.Middleware(App.authorize)
@Controller("/api")
@DocController("API Controller")
export default class API {

    static getToken(context: Context): string {
        let token = context.request.headers["accessToken"];
        if (!token) {
            token = context.request.user.accessToken;
        }

        return token;
    }

    @K.Get()
    user(context: Context) {
        return context.request.user;
    }

    @K.Get()
    async organizations(context: Context, @K.FromQuery("user") user: string, @K.FromQuery("pass") pass: string) {
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

    @K.Post("/:issueId/effort")
    async effort(
        context: Context,
        @K.FromPath("issueId") issueId: string,
        @K.FromBody() body: any) {

        let timeTracking = new TimeTrackingService();
        let amount = parseInt(body.amount);
        if (!amount || isNaN(amount) || amount < 1) {
            throw new Error("Amount must be a positive integer");
        }

        await timeTracking.addDedicatedEffort(issueId, amount, context.request.user.username);

        context.response.sendStatus(200);
    }

    @K.Post("/:issueId/estimate")
    async estimate(
        context: Context,
        @K.FromPath("issueId") issueId: string,
        @K.FromBody() body: any) {

        let timeTracking = new TimeTrackingService();
        let amount = parseInt(body.amount);
        if (!amount || isNaN(amount) || amount < 1) {
            throw new Error("Amount must be a positive integer");
        }

        await timeTracking.addEstimate(issueId, amount, context.request.user.username);

        context.response.sendStatus(200);
    }

    @K.Get("/:issueId/timeTracking")
    async timeTracking(
        context: Context,
        @K.FromQuery("user") user: string,
        @K.FromQuery("pass") pass: string,
        @K.FromPath("issueId") issueId: string) {

        let timeTracking = new TimeTrackingService();

        return timeTracking.getTimeTracking(issueId);
    }
}