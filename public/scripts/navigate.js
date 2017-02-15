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
            window.status = "Loading...";
        },
        complete: () => {
            window.status = "Done!";
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
        for (let org of data) {
            let li = $(`<li id="${org.id}">${org.name}</li>`);
            list.append(li);
        }
    });
}
function loadRepos(org) {
    let list = repos.find("ul");
    list.empty();
    $.get(`/api/repos?org=${org}`, undefined, (data) => {
        for (let repo of data) {
            let li = $(`<li id="${repo.id}" org="${org}">${repo.name}</li>`);
            list.append(li);
        }
    });
}
function loadIssues(org, repo) {
    let list = issues.find("ul");
    list.empty();
    $.get(`/api/issues?org=${org}&repo=${repo}`, undefined, (data) => {
        for (let issue of data) {
            let li = $(`
                    <li id="${issue.id}" org="${org}" repo="${repo}" number="${issue.number}">
                        <a href="/frontend/quickUrl?url=${issue.url}">
                            ${issue.name}
                        </a>
                    </li>`);
            list.append(li);
        }
    });
}
//# sourceMappingURL=navigate.js.map