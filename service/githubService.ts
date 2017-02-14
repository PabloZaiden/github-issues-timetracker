import { Organization, Repo, Issue } from './githubService';
import * as Github from "github";
import * as K from "kwyjibo";


export default class GithubService {

    private accessToken: string;
    private github: Github;

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

        let reposRaw: any[] = await this.github.repos.getForOrg({
            org: orgName,
        });

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
            owner: org
        };

        let fullParams = {
            ...filter,
            ...params
        };

        let issuesRaw: any[] = await this.github.issues.getForRepo(fullParams);

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