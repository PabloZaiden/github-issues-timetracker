class Issue {
    private static instance: Issue;
    static init() {
        Issue.instance = new Issue();
    }

    constructor() {
        $(document).ready(() => {
        });
    }

    private newEstimate(issueId: string) {
        this.sendAmount(document["urls"].API.estimate.post.replace(":issueId", issueId), parseInt($("#estimate").val()));
    }

    private newEffort(issueId: string) {
        this.sendAmount(document["urls"].API.effort.post.replace(":issueId", issueId), parseInt($("#effort").val()));
    }

    private sendAmount(url: string, amount: number) {
        $("button").prop("disabled", true);

        let settings: JQueryAjaxSettings = {
            url: url,
            method: "POST",
            data: { amount: amount },
            success: (data) => {
                location.reload(true);
            },
            error: (err) => {
                alert(err.status);
                $("button").prop("disabled", false);
            }
        };

        $.ajax(settings);
    }
}

Issue.init();