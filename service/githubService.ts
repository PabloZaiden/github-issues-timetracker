import { User, Organization, Repo, Issue, Milestone } from "./../models/api";
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

    private async getPagedCollection<T, U>(params: any, callback: (params: any) => Promise<any>, mapper: (p: T) => U) {
        let more = true;
        let current = 1;
        let raw: any[] = [];

        while (more) {
            let fullParams = {
                ...params,
                page: current,
                per_page: GithubService.perPage
            };

            let page: GithubArrayResult = await callback(fullParams);

            raw.push(...page.data);
            let hasNext = this.github.hasNextPage(page);
            more = hasNext != undefined;
            current++;
        }

        let actual = raw.map(mapper);

        return actual;
    }

    async getCurrentUser() {
        let user: GithubResult = await (this.github as any).users.get({});
        return user.data;
    }

    async getOrganizations() {
        let memberships: GithubArrayResult = await this.github.users.getOrgMemberships({
            state: "active"
        });

        let orgs = memberships.data.map(m => {
            return new Organization(m.organization);
        });

        // add the current user as an organization
        // TODO: add this when the new github lib is available
        //let currentUser = await this.github.users.get();

        let currentUser = await this.getCurrentUser();

        orgs.push({
            id: currentUser.id,
            name: currentUser.login
        });

        return orgs;
    }

    async getRepos(orgName: string) {
        let user = await this.getCurrentUser();

        let mapper = (r: any) => {
            return new Repo(r);
        };


        let repos: Repo[];

        if (user.login === orgName) {
            let params = {
                username: user.login
            };

            repos = await this.getPagedCollection(params, this.github.repos.getForUser, mapper);
        } else {
            let params = {
                org: orgName
            };
            repos = await this.getPagedCollection(params, this.github.repos.getForOrg, mapper);
        }

        return repos;
    }

    async getIssues(org: string, repo: string, filter?: Object) {
        let params = {
            repo: repo,
            owner: org,
            ...filter
        };

        let mapper = (r: any) => {
            return new Issue(r);
        };

        let issues = await this.getPagedCollection(params, this.github.issues.getForRepo, mapper);

        return issues;
    }

    async getIssuesByMilestone(org: string, repo: string, milestone: number, filter?: Object) {
        return this.getIssues(org, repo, { milestone: milestone, ...filter });
    }

    async getIssue(org: string, repo: string, number: number) {
        let issueRaw: GithubResult = await this.github.issues.get({
            owner: org,
            repo: repo,
            number: number
        });

        return new Issue(issueRaw.data);
    }

    async getMilestones(org: string, repo: string, state?: "open" | "closed" | "all") {
        let params = {
            state: state,
            repo: repo,
            owner: org
        };

        let mapper = (r: any) => {
            r.repo = repo;
            r.org = org;
            return new Milestone(r);
        };

        let milestones = await this.getPagedCollection(params, this.github.issues.getMilestones, mapper);

        return milestones;
    }

    async getMilestone(org: string, repo: string, number: number) {
        let milestoneRaw: GithubResult = await this.github.issues.getMilestone({
            owner: org,
            repo: repo,
            number: number
        });

        milestoneRaw.data.repo = repo;
        milestoneRaw.data.org = org;
        return new Milestone(milestoneRaw.data);
    }
}


interface GithubResult {
    data: any;
    meta: {
        link: string;
        [key: string]: string;
    };
}

interface GithubArrayResult extends GithubResult {
    data: any[];
}