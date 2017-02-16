import { Organization, Repo, Issue } from './githubService';
import * as Github from "github";
import * as K from "kwyjibo";
import * as Request from "request";


export default class GithubService {

    private accessToken: string;
    private github: Github;

    private static userAgent = "github-ussues-timetracker-v0.1";
    private static perPage = 100;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
        this.github = new Github({
            protocol: "https",
            headers: {
                "user-agent": GithubService.userAgent
            }
        });

        this.github.authenticate({
            type: "oauth",
            token: accessToken
        });
    }

    private static async getPagedCollection<T, U>(params: any, callback: (params: any) => Promise<any>, mapper: (p: T) => U) {
        let more = true;
        let current = 1;
        let raw: any[] = [];

        while (more) {
            let fullParams = {
                ...params,
                page: current,
                per_page: GithubService.perPage
            };

            let page: any[] = await callback(fullParams);

            let lastPage = GithubService.getLastPage(page);

            raw.push(...page);
            more = current !== lastPage;
            current++;
        }

        let actual = raw.map(mapper);

        return actual;
    }

    private static getLastPage(arr: any[]): number {
        let meta = arr["meta"];
        let links: string = meta.link;

        if (links == undefined) {
            return 1;
        }

        let parts = links.split(",");
        let lastUrl = parts.find(p => p.endsWith("rel=\"last\""));
        let matches = /\?page=([0-9]+)&/.exec(lastUrl);

        let lastPage = parseInt(matches[1]);

        return lastPage;
    }

    async getCurrentUser() {
        // TODO: replace this with the following lines when they start to work
        //let user = await this.github.users.get();
        //return user;

        return new Promise<User>((resolve, reject) => {
            Request(
                "https://api.github.com/user",
                {
                    headers: {
                        "user-agent": GithubService.userAgent
                    },
                    auth: {
                        bearer: this.accessToken,
                    }
                },
                (error, response, body) => {
                    if (error) {
                        reject(error);
                    } else {
                        if (response.statusCode < 200 || response.statusCode >= 300) {
                            throw new Error("Invalid status: " + response.statusCode);
                        }
                        resolve(JSON.parse(body) as User);
                    }
                });
        });
    }

    async getOrganizations() {
        let memberships: any[] = await this.github.users.getOrgMemberships({
            state: "active"
        });

        let orgs = memberships.map(m => {
            let org: Organization = {
                id: m.organization.id,
                name: m.organization.login
            };

            return org;
        });

        return orgs;
    }

    async getRepos(orgName: string) {
        let params = {
            org: orgName
        };

        let mapper = (r: any) => {
            return {
                name: r.name,
                id: r.id,
            } as Repo;
        };

        let repos = await GithubService.getPagedCollection(params, this.github.repos.getForOrg, mapper);

        return repos;
    }

    async getIssues(org: string, repo: string, filter?: Object) {
        let params = {
            repo: repo,
            owner: org,
            ...filter
        };

        let mapper = (r: any) => {
            return {
                name: r.title,
                id: r.id,
                state: r.state,
                number: r.number,
                url: r.url
            } as Issue;
        };

        let issues = await GithubService.getPagedCollection(params, this.github.issues.getForRepo, mapper);

        return issues;
    }

    async getIssuesByMilestone(org: string, repo: string, milestone: number, filter?: Object) {
        return this.getIssues(org, repo, {milestone: milestone, ...filter});
    }

    async getIssue(org: string, repo: string, number: number) {
        let issueRaw = await this.github.issues.get({
            owner: org,
            repo: repo,
            number: number
        });

        return {
            name: issueRaw.title,
            id: issueRaw.id,
            state: issueRaw.state,
            number: issueRaw.number,
            url: issueRaw.html_url
        } as Issue;
    }

    async getMilestones(org: string, repo: string, state?: "open" | "closed" | "all") {
        let params = {
            state: state,
            repo: repo,
            owner: org
        };

        let mapper = (r: any) => {
            return {
                name: r.title,
                id: r.id,
                state: r.state,
                number: r.number,
                url: r.html_url
            } as Milestone;
        };

        let milestones = await GithubService.getPagedCollection(params, this.github.issues.getMilestones, mapper);

        return milestones;
    }

    async getMilestone(org: string, repo: string, number: number) {
        let milestoneRaw = await this.github.issues.getMilestone({
            owner: org,
            repo: repo,
            number: number
        });

        return {
            name: milestoneRaw.title,
            id: milestoneRaw.id,
            state: milestoneRaw.state,
            number: milestoneRaw.number,
            url: milestoneRaw.html_url
        } as Milestone;
    }
}


export interface EntityBase {
    name: string,
    id: any
}

export interface Repo extends EntityBase {
}

export interface Organization extends EntityBase {
}

export interface Milestone extends EntityBase {
    state: "open" | "closed";
    number: number;
    url: string;
}

export interface Issue extends EntityBase {
    state: "open" | "closed";
    number: number;
    url: string;
}

export interface User extends EntityBase {
    login: string,
    email: string,
    avatar_url: string
}