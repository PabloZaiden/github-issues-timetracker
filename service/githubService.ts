import * as Github from "github";

export default class GithubService {
    
    constructor () {

    }

    getProjects(): Project[] {
        return [];
    }

    getIssues(projectId: string, filter? : string): Issue[] {
        return [];
    }
}

export interface Project {
    name: string,
    id: string
}

export interface Issue {
    id: string,
    title: string
}