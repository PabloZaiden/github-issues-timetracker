import Utils from "../utils";

import { Field, PredefinedMaps } from "tom-collins";

export class AmountPayload {
    @Field({ 
        typeConstraints: Utils.Validations.positiveNatural,
        maps: PredefinedMaps.stringToNumber
    })
    amount: number;
}

export interface IssueTimeTrackingData {
    timeTracking: TimeTracking;
    currentEstimate: number;
    totalEffort: number;
}

export interface TimeTracking {
    issueId: string;
    estimates: Effort[];
    dedicatedEffort: Effort[];
}

export interface Effort {
    date: Date;
    amount: number;
    user: string;
}

export interface DayEntry {
    issues: {
        [key: string]: IssueTimeTrackingData;
    };
    currentEstimate: number;
    totalEffort: number;
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

import * as K from "kwyjibo";
export import Dictionary = K.Dictionary;