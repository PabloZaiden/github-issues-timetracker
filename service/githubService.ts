import { Organization, Repo, Issue } from './githubService';
import * as Github from "github";
import * as K from "kwyjibo";


export default class GithubService {

    private accessToken: string;
    private github: Github;

    private static perPage = 100;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
        this.github = new Github({
            protocol: "https",
            headers: {
                "user-agent": "github-ussues-timetracker-v0.1"
            }
        });

        this.github.authenticate({
            type: "oauth",
            token: accessToken
        });
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
        let reposRaw: any[] = [];

        let more = true;
        let current = 1;

        while (more) {
            let reposPage: any[] = await this.github.repos.getForOrg({
                org: orgName,
                per_page: GithubService.perPage,
                page: current
            });

            let lastPage = GithubService.getLastPage(reposPage);

            reposRaw = reposRaw.concat(reposPage);
            more = current == lastPage;
            current++;
        }

        let repos = reposRaw.map(r => {
            let repo: Repo = {
                name: r.name,
                id: r.id
            };

            return repo;
        });

        return repos;
    }

    async getIssues(org: string, repo: string, filter?: Object) {
        let params = {
            repo: repo,
            owner: org,
            per_page: GithubService.perPage
        };

        let more = true;
        let current = 1;
        let issuesRaw: any[] = [];

        while (more) {
            let fullParams = {
                ...filter,
                ...params,
                page: current
            };

            let issuesPage: any[] = await this.github.issues.getForRepo(fullParams);

            let lastPage = GithubService.getLastPage(issuesPage);

            issuesRaw = issuesRaw.concat(issuesPage);
            more = current == lastPage;
            current++;
        }

        let issues = issuesRaw.map(r => {
            let issue: Issue = {
                name: r.title,
                id: r.id,
                state: r.state,
                number: r.number,
                url: r.url
            };

            return issue;
        });

        return issues;
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
}


export interface EntityBase {
    name: string,
    id: any
}

export interface Repo extends EntityBase {
}

export interface Organization extends EntityBase {
}

export interface Issue extends EntityBase {
    state: "open" | "closed";
    number: number;
    url: string;
}