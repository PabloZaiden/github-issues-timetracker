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
                        resolve(new User(JSON.parse(body)));
                    }
                });
        });
    }

    async getOrganizations() {
        let memberships: any[] = await this.github.users.getOrgMemberships({
            state: "active"
        });

        let orgs = memberships.map(m => {
            return new Organization(m.organization);
        });

        return orgs;
    }

    async getRepos(orgName: string) {
        let params = {
            org: orgName
        };

        let mapper = (r: any) => {
            return new Repo(r);
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
            return new Issue(r);
        };

        let issues = await GithubService.getPagedCollection(params, this.github.issues.getForRepo, mapper);

        return issues;
    }

    async getIssuesByMilestone(org: string, repo: string, milestone: number, filter?: Object) {
        return this.getIssues(org, repo, { milestone: milestone, ...filter });
    }

    async getIssue(org: string, repo: string, number: number) {
        let issueRaw = await this.github.issues.get({
            owner: org,
            repo: repo,
            number: number
        });

        return new Issue(issueRaw);
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

        let milestones = await GithubService.getPagedCollection(params, this.github.issues.getMilestones, mapper);

        return milestones;
    }

    async getMilestone(org: string, repo: string, number: number) {
        let milestoneRaw = await this.github.issues.getMilestone({
            owner: org,
            repo: repo,
            number: number
        });

        milestoneRaw.repo = repo;
        milestoneRaw.org = org;
        return new Milestone(milestoneRaw);
    }
}


export class EntityBase {
    name: string;
    id: any

    constructor(r: any) {
        this.name = r.name
        this.id = r.id;
    }
}

export class Repo extends EntityBase {
}

export class Organization extends EntityBase {
    constructor(r: any) {
        super(r);
        this.name = r.login;
    }
}

export class Milestone extends EntityBase {

    state: "open" | "closed";
    number: number;
    url: string;
    created_at: Date;
    due_on: Date;
    closed_at: Date;
    repo: string;
    org: string;

    constructor(r: any) {
        super(r);

        this.repo = r.repo;
        this.org = r.org;
        this.name = r.title;
        this.id = r.id;
        this.state = r.state;
        this.number = r.number;
        this.url = r.html_url;
        this.created_at = parseDate(r.created_at);
        this.due_on = parseDate(r.due_on);
        this.closed_at = parseDate(r.closed_at);
    }
}

export class Issue extends EntityBase {

    state: "open" | "closed";
    number: number;
    url: string;

    constructor(r: any) {
        super(r);

        this.name = r.title;
        this.state = r.state;
        this.number = r.number;
        this.url = r.html_url;
    }
}

export class User extends EntityBase {
    login: string;
    email: string;
    avatar_url: string;
    
    constructor(r: any) {
        super(r);

        this.login = r.login;
        this.email = r.email;
        this.avatar_url = r.avatar_url;
    }
}

function parseDate(d: string) {
    if (d === "" || d == undefined) {
        return null;
    } else {
        return new Date(d);
    }
}