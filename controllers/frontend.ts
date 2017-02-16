import { Issue } from './../service/githubService';
import { TimeTracking, TimeTrackingService } from "../service/timeTrackingService";
import { DocController, DocAction, Get, Post, Context, ActionMiddleware, Controller } from "kwyjibo";
import * as K from "kwyjibo";
import App from "../app";
import GithubService from "../service/githubService";
import API from "./api";


@Controller("/frontend")
@K.Middleware(App.authorize)
class Frontend {

    @Get("/urls")
    urls(context: Context, @K.FromQuery("type") type: string) {
        if (type === "script") {
            return `document["urls"] = ${JSON.stringify(K.getRoutes())}`;
        } else {
            return K.getRoutes();
        }
    }

    @Get("/")
    index(context: Context): void {
        context.response.redirect(K.getActionRoute(Frontend, "navigate"));
    }

    @Get()
    navigate(context: Context): K.Renderable {
        return {
            urls: K.getRoutes(),
            $render_view: "navigate"
        };
    }

    @Get()
    async quickUrl(context: Context, @K.FromQuery("url") url: string) {
        if (url == undefined) {
            throw new Error("Missing url");
        }

        let githubUrlBase = ["https://github.com/", "https://www.github.com/", "https://api.github.com/repos/"];

        let found = false;
        for (let start of githubUrlBase) {
            if (url.startsWith(start)) {
                found = true;
                url = url.substr(start.length);
                break;
            }
        }

        if (!found) {
            throw new Error("Invalid url");
        }

        let parts = url.split("/", );

        if (parts.length != 4) {
            throw new Error("Invalid url");
        }

        let org = parts[0];
        let repo = parts[1];
        let number = parts[3];

        let action = "";
        switch (parts[2]) {
            case "issues":
                action = "issue";
                break;

            case "milestone":
                action = "milestone";
                break;

            default:
                throw new Error("Invalid url");
        }

        let baseUrl = K.getActionRoute(Frontend, action);
        context.response.redirect(baseUrl + `?org=${org}&repo=${repo}&number=${number}`);
    }

    private async getIssueTimeTrackingData(issueId: string) {
        let timeTrackingService = new TimeTrackingService();
        let timeTracking = await timeTrackingService.getTimeTracking(issueId);

        let currentEstimate = 0;
        if (timeTracking.estimates.length > 0) {
            currentEstimate = timeTracking.estimates[0].amount;
        }

        let totalEffort = 0;
        if (timeTracking.dedicatedEffort.length > 0) {
            totalEffort = timeTracking.dedicatedEffort.map((e) => e.amount).reduce(Frontend.sum);
        }

        return {
            timeTracking: timeTracking,
            currentEstimate: currentEstimate,
            totalEffort: totalEffort
        } as IssueTimeTrackingData;
    }

    @Get()
    async issue(context: Context, @K.FromQuery("org") org: string, @K.FromQuery("repo") repo: string, @K.FromQuery("number") number: string): Promise<K.Renderable> {
        let gh = new GithubService(API.getToken(context));
        let issue = await gh.getIssue(org, repo, parseInt(number));

        let issueData = await this.getIssueTimeTrackingData(issue.id);;

        return {
            ...issueData,
            issue: issue,
            urls: K.getRoutes({ ":issueId": issue.id }),
            $render_view: "issue"
        };
    }

    @Get()
    async milestone(context: Context, @K.FromQuery("org") org: string, @K.FromQuery("repo") repo: string, @K.FromQuery("number") number: string): Promise<K.Renderable> {
        let gh = new GithubService(API.getToken(context));

        let milestone = await gh.getMilestone(org, repo, parseInt(number));

        let issues = await gh.getIssuesByMilestone(org, repo, milestone.number, { state: "all" });

        for (let issue of issues) {
            issue["timeTrackingData"] = await this.getIssueTimeTrackingData(issue.id);
        }

        let currentEstimate = 0;
        let totalEffort = 0;

        if (issues.length > 0) {
            let estimates = issues.map(i => {
                let issueTimeTrackingData = i["timeTrackingData"] as IssueTimeTrackingData;
                if (issueTimeTrackingData.timeTracking.estimates.length > 0) {
                    return issueTimeTrackingData.timeTracking.estimates[0].amount;
                } else {
                    return 0;
                }
            });

            let efforts = issues.map(i => {
                let issueTimeTrackingData = i["timeTrackingData"] as IssueTimeTrackingData;
                if (issueTimeTrackingData.timeTracking.dedicatedEffort.length > 0) {
                    return issueTimeTrackingData.timeTracking.dedicatedEffort.map(d => { return d.amount }).reduce(Frontend.sum);
                } else {
                    return 0;
                }
            });

            if (efforts.length > 0) {
                totalEffort = efforts.reduce(Frontend.sum);
            }

            if (estimates.length > 0) {
                currentEstimate = estimates.reduce(Frontend.sum);
            }
        }


        return {
            milestone: milestone,
            issues: issues,
            currentEstimate: currentEstimate,
            totalEffort: totalEffort,
            urls: K.getRoutes({ ":milestoneId": milestone.id }),
            $render_view: "milestone"
        };
    }

    private static sum(n1: number, n2: number) {
        return n1 + n2;
    }
}

interface IssueTimeTrackingData {
    timeTracking: TimeTracking,
    currentEstimate: number,
    totalEffort: number
}

interface Dictionary<T> {
    [key: string]: T;
}