let organizations: JQuery;
let repos: JQuery;
let issues: JQuery;

$(document).ready(() => {
    $.get(
        "/Frontend/urls",
        (data) => {
            document["urls"] = data;

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


});

function checkLists(): void {
    if (organizations.find("li").length === 0) {
        organizations.hide();
    } else {
        organizations.show();
    }

    if (repos.find("li").length === 0) {
        repos.hide();
    } else {
        repos.show();
    }

    if (issues.find("li").length === 0) {
        issues.hide();
    } else {
        issues.show();
    }
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

