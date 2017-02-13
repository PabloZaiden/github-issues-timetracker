import { Organization, Project, Issue } from './githubService';
import * as Github from "github";
import * as K from "kwyjibo";


export default class GithubService {

    // TODO: Change for oauth2 tokens
    private user: string;
    private pass: string;

    private github: Github;

    constructor(user: string, pass: string) {
        this.user = user;
        this.pass = pass;
        this.github = new Github({
            protocol: "https",
            headers: {
                "user-agent": "github-ussues-timetracker-v0.1"
            }
        });

        this.github.authenticate({
            type: "basic",
            username: user,
            password: pass
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

    async getProjects(orgName: string) {

        let repos: any[] = await this.github.repos.getForOrg({
            org: orgName,
        });

        let projects = repos.map(r => {
            let project : Project = {
                name: r.name,
                id: r.id
            };

            return project;
        });

        return projects;
    }

    async getIssues(projectName: string, orgName: string, filter?: Object) {
        let params = {
            repo: projectName,
            owner: orgName
        };

        let fullParams = {
            ...filter,
            ...params
        };

        let issuesRaw: any[] = await this.github.issues.getForRepo(fullParams);

        let issues = issuesRaw.map(r => {
            let issue : Issue = {
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
}


export interface EntityBase {
    name: string,
    id: any
}

export interface Project extends EntityBase {
}

export interface Organization extends EntityBase {
}

export interface Issue extends EntityBase {
    state: "open" | "close";
    number: number;
    url: string;
}