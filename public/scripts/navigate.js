let organizations;
let repos;
let issues;
$(document).ready(() => {
    organizations = $("#organizations");
    repos = $("#repos");
    issues = $("#issues");
    organizations.bind("li").click((elem) => {
        let org = $(elem.target).text();
        loadRepos(org);
    });
    repos.bind("li").click((elem) => {
        let repo = $(elem.target).text();
        let org = $(elem.target).attr("org");
        loadIssues(org, repo);
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
function checkLists() {
    if (organizations.find("li").length === 0) {
        organizations.hide();
    }
    else {
        organizations.show();
    }
    if (repos.find("li").length === 0) {
        repos.hide();
    }
    else {
        repos.show();
    }
    if (issues.find("li").length === 0) {
        issues.hide();
    }
    else {
        issues.show();
    }
}
function loadOrganizations() {
    let list = organizations.find("ul");
    list.empty();
    $.get("/api/organizations", undefined, (data) => {
        document;
        for (let org of data) {
            let li = $(`<li />`);
            li.attr("id", org.id);
            li.text(org.name);
            list.append(li);
        }
    });
}
function loadRepos(org) {
    let list = repos.find("ul");
    list.empty();
    $.get(`/api/repos?org=${org}`, undefined, (data) => {
        for (let repo of data) {
            let li = $(`<li />`);
            li.attr("id", repo.id);
            li.attr("org", org);
            li.text(repo.name);
            list.append(li);
        }
    });
}
function loadIssues(org, repo) {
    let list = issues.find("ul");
    list.empty();
    $.get(`/api/issues?org=${org}&repo=${repo}`, undefined, (data) => {
        for (let issue of data) {
            let li = $(`<li />`);
            li.attr("id", issue.id);
            li.attr("org", org);
            li.attr("repo", repo);
            li.attr("number", issue.number);
            let a = $("<a />");
            a.attr("href", `/frontend/quickUrl?url=${encodeURI(issue.url)}`);
            a.text(issue.name);
            li.append(a);
            list.append(li);
        }
    });
}
//# sourceMappingURL=navigate.js.map