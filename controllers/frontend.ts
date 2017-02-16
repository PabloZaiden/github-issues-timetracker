import { Issue } from './../service/githubService';
import TimeTrackingService from './../service/timeTrackingService';
import { DocController, DocAction, Get, Post, Context, ActionMiddleware, Controller } from "kwyjibo";
import * as K from "kwyjibo";
import App from "../app";
import GithubService from "../service/githubService";
import API from "./api";


@Controller("/frontend")
@K.Middleware(App.authorize)
class Frontend {

    private static routesToUrl(controllers: K.ControllerDocNode[], baseUrl?: string, replacements?: Dictionary<string>) {
        if (baseUrl == undefined) {
            baseUrl = "";
        }

        if (replacements == undefined) {
            replacements = {};
        }

        let urls: any = {};
        for (let controller of controllers) {
            urls[controller.name] = {};
            for (let method of controller.methods) {
                urls[controller.name][method.name] = {};
                for (let mountPoint of method.mountpoints) {
                    let url = baseUrl + controller.path + mountPoint.path;

                    for (let key in replacements) {
                        url = url.replace(new RegExp(key, 'g'), replacements[key]);
                    }

                    urls[controller.name][method.name][mountPoint.httpMethod] = url;
                }
            }

            let childUrls = Frontend.routesToUrl(controller.childs, controller.path);

            urls = {
                ...urls,
                ...childUrls
            };
        }

        return urls;
    }

    private static getUrls(replacements?: Dictionary<string>) {
        return Frontend.routesToUrl(K.getDocs(), undefined, replacements);
    }

    @Get("/urls")
    urls(context?: Context) {
        return Frontend.getUrls();
    }

    @Get("/")
    index(context: Context): void {
        context.response.redirect(K.getActionRoute(Frontend, "navigate"));
    }

    @Get()
    navigate(context: Context): SuperRenderable {
        return {
            urls: Frontend.getUrls(),
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

        let baseUrl = K.getActionRoute(Frontend, "issue");
        context.response.redirect(baseUrl + `?org=${org}&repo=${repo}&number=${number}`);
    }

    @Get()
    async issue(context: Context, @K.FromQuery("org") org: string, @K.FromQuery("repo") repo: string, @K.FromQuery("number") number: string): Promise<SuperRenderable> {
        let gh = new GithubService(API.getToken(context));
        let timeTrackingService = new TimeTrackingService();

        let issue = await gh.getIssue(org, repo, parseInt(number));
        let timeTracking = await timeTrackingService.getTimeTracking(issue.id);

        let currentEstimate = 0;
        if (timeTracking.estimates.length > 0) {
            currentEstimate = timeTracking.estimates[0].amount;
        }

        let totalEffort = 0;
        if (timeTracking.dedicatedEffort.length > 0) {
            totalEffort = timeTracking.dedicatedEffort.map((e) => parseInt(e.amount.toString())).reduce((prev, curr) => prev + curr);
        }

        return {
            issue: issue,
            timeTracking: timeTracking,
            currentEstimate: currentEstimate,
            totalEffort: totalEffort,
            urls: Frontend.getUrls({ ":issueId": issue.id }),
            $render_view: "issue"
        };
    }
}

export interface SuperRenderable extends K.Renderable {
    [key: string]: any;
}

interface Dictionary<T> {
    [key: string]: T;
}