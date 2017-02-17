class Navigate {

    private organizations: JQuery;
    private repos: JQuery;
    private issues: JQuery;
    private milestones: JQuery;
    private filter: JQuery

    private static instance: Navigate;
    static init() {
        Navigate.instance = new Navigate();
    }

    private constructor() {
        $(document).ready(() => {

            this.organizations = $("#organizations");
            this.repos = $("#repos");
            this.issues = $("#issues");
            this.milestones = $("#milestones");
            this.filter = $("#filter");

            this.filter.on("input", () => {
                this.filterLists();
            });

            this.filter.change(() => {
                this.filterLists();
            });

            this.organizations.bind("li").click((elem) => {
                let org = $(elem.target).text();
                this.clearFilter();
                this.loadRepos(org);
            });

            this.repos.bind("li").click((elem) => {
                let repo = $(elem.target).text();
                let org = $(elem.target).attr("org");
                this.clearFilter();
                this.loadIssues(org, repo);
                this.loadMilestones(org, repo);
            });

            this.checkLists();

            $.ajaxSetup({
                beforeSend: () => {
                    $("#loader").fadeIn();
                },
                complete: () => {
                    $("#loader").fadeOut();
                    this.checkLists();
                }
            });

            this.loadOrganizations();

        });
    }

    private filterLists() {
        let text: string = this.filter.val();

        let filterPredicate = (t: string) => {
            return t.toLowerCase().indexOf(text.toLowerCase()) >= 0;
        }

        this.hideFromList(
            this.repos,
            (e) => {
                return e.text();
            },
            text);

        this.hideFromList(
            this.milestones,
            (e) => {
                return e.find("a").text();
            },
            text);

        this.hideFromList(
            this.issues,
            (e) => {
                return e.find("a").text();
            },
            text);

    }

    private hideFromList(originalList: JQuery, textFinder: (e: JQuery) => string, filter: string) {
        let toHide = originalList.find("li").toArray().filter(elem => {
            return textFinder($(elem)).indexOf(filter) === -1;
        });

        let toShow = originalList.find("li").toArray().filter(elem => {
            return textFinder($(elem)).indexOf(filter) !== -1;
        });

        toHide.forEach((e) => $(e).hide());
        toShow.forEach((e) => $(e).show());
    }

    private clearFilter() {
        $("#filter").val("").change();
    }

    private showIfAny(list: JQuery) {
        if (list.find("li").length === 0) {
            list.hide();
        } else {
            list.show();
        }
    }

    private checkLists(): void {
        this.showIfAny(this.organizations);
        this.showIfAny(this.repos);
        this.showIfAny(this.issues);
        this.showIfAny(this.milestones);
    }

    private loadOrganizations(): void {
        let list = this.organizations.find("ul");
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

    private loadRepos(org: string): void {
        let list = this.repos.find("ul");
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

    private loadIssues(org: string, repo: string): void {
        let list = this.issues.find("ul");
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

    private loadMilestones(org: string, repo: string): void {
        let list = this.milestones.find("ul");
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
}

Navigate.init();