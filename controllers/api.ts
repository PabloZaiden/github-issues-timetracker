import TimeTrackingService from "../service/timeTrackingService";
import {DocController, DocAction, Get, Post, Context, ActionMiddleware, Controller} from "kwyjibo";
import * as K from "kwyjibo";
import App from "../app";
import GithubService from "../service/githubService";

@K.Middleware(App.authorize)
@Controller("/api")
@DocController("API Controller")
class API {

    @K.Get()
    async organizations(context: Context, @K.FromQuery("user") user: string, @K.FromQuery("pass") pass: string) {
        let gh = new GithubService(context.request.user.accessToken);

        let orgs = await gh.getOrganizations();
        
        return orgs;
    }

    @K.Get()
    async projects(
        context: Context, 
        @K.FromQuery("org") orgName: string) {
        
        let gh = new GithubService(context.request.user.accessToken);

        let projects = await gh.getProjects(orgName);
        
        return projects;
    }

    @K.Get()
    async issues(
        context: Context, 
        @K.FromQuery("org") org: string,
        @K.FromQuery("project") project: string) {
        
        let gh = new GithubService(context.request.user.accessToken);

        let issues = await gh.getIssues(project, org);
        
        return issues;
    }

    @K.Post("/:issueId/effort")
    async effort(
        context: Context, 
        @K.FromPath("issueId") issueId: string,
        @K.FromBody() body: any) {
        
        let timeTracking = new TimeTrackingService();
        let amount = body.amount;
        if (amount < 1) {
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
        let amount = body.amount;
        if (amount < 1) {
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