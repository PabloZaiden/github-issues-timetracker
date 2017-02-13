import {DocController, DocAction, Get, Post, Context, ActionMiddleware, Controller} from "kwyjibo";
import * as K from "kwyjibo";
import App from "../app";
import GithubService from "../service/githubService";


@Controller("/api")
@DocController("API Controller")
class API {

    @K.Get()
    async organizations(context: Context, @K.FromQuery("user") user: string, @K.FromQuery("pass") pass: string) {
        let gh = new GithubService(user, pass);

        let orgs = await gh.getOrganizations();
        
        return orgs;
    }

    @K.Get()
    async projects(
        context: Context, 
        @K.FromQuery("user") user: string, 
        @K.FromQuery("pass") pass: string, 
        @K.FromQuery("org") orgName: string) {
        
        let gh = new GithubService(user, pass);

        let projects = await gh.getProjects(orgName);
        
        return projects;
    }

    @K.Get()
    async issues(
        context: Context, 
        @K.FromQuery("user") user: string, 
        @K.FromQuery("pass") pass: string, 
        @K.FromQuery("org") org: string,
        @K.FromQuery("project") project: string) {
        
        let gh = new GithubService(user, pass);

        let issues = await gh.getIssues(project, org);
        
        return issues;
    }
}

export interface SuperRenderable extends K.Renderable {
    [key: string]: any;
}