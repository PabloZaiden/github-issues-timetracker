let organizations: JQuery;
let repos: JQuery;
let issues: JQuery;
let milestones: JQuery;

$(document).ready(() => {

    organizations = $("#organizations");
    repos = $("#repos");
    issues = $("#issues");
    milestones = $("#milestones");

    organizations.bind("li").click((elem) => {
        let org = $(elem.target).text();
        loadRepos(org);
    });

    repos.bind("li").click((elem) => {
        let repo = $(elem.target).text();
        let org = $(elem.target).attr("org");
        loadIssues(org, repo);
        loadMilestones(org, repo);
    });

    checkLists();

    $.ajaxSetup({
        beforeSend: () => {
            $("#loader").fadeIn();
        },
        complete: () => {
            $("#loader").fadeOut();
            checkLists();
        }
    });

    loadOrganizations();

});

function showIfAny(list: JQuery) {
    if (list.find("li").length === 0) {
        list.hide();
    } else {
        list.show();
    }
}

function checkLists(): void {
    showIfAny(organizations);
    showIfAny(repos);
    showIfAny(issues);
    showIfAny(milestones);
}

function loadOrganizations(): void {
    let list = organizations.find("ul");
    list.empty();

    $.get(
        document["urls"].API.organizations.get,
        undefined,
        (data) => {
            document
            for (let org of data) {
                let li = $(`<li />`);
                li.attr("id", org.id);
                li.text(org.name);
                list.append(li);
            }
        }
    );
}

function loadRepos(org: string): void {
    let list = repos.find("ul");
    list.empty();

    $.get(
        document["urls"].API.repos.get + `?org=${org}`,
        undefined,
        (data) => {
            for (let repo of data) {
                let li = $(`<li />`);
                li.attr("id", repo.id);
                li.attr("org", org);
                li.text(repo.name);
                list.append(li);
            }
        }
    );
}

function loadIssues(org: string, repo: string): void {
    let list = issues.find("ul");
    list.empty();

    $.get(
        document["urls"].API.issues.get + `?org=${org}&repo=${repo}`,
        undefined,
        (data) => {
            for (let issue of data) {
                let li = $(`<li />`);

                li.attr("id", issue.id);
                li.attr("org", org);
                li.attr("repo", repo);
                li.attr("number", issue.number);

                let a = $("<a />");
                a.attr("href", document["urls"].Frontend.quickUrl.get + `?url=${encodeURI(issue.url)}`);
                a.text(issue.name);

                li.append(a);

                list.append(li);
            }
        }
    );
}

function loadMilestones(org: string, repo: string): void {
    let list = milestones.find("ul");
    list.empty();

    $.get(
        document["urls"].API.milestones.get + `?org=${org}&repo=${repo}`,
        (data) => {
            for (let milestone of data) {
                let li = $(`<li />`);

                li.attr("id", milestone.id);
                li.attr("org", org);
                li.attr("repo", repo);
                li.attr("number", milestone.number);

                let a = $("<a />");
                a.attr("href", document["urls"].Frontend.quickUrl.get + `?url=${encodeURI(milestone.url)}`);
                a.text(milestone.name);

                li.append(a);

                list.append(li);
            }
        }
    );
}

