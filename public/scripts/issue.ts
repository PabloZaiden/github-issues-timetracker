class Issue {
    private static instance: Issue;

    private issueId: string;

    static init() {
        Issue.instance = new Issue();
    }

    constructor() {
        $(document).ready(() => {
            let issueId = $("#issueId").val();
            this.issueId = issueId;
            
            $("#newEstimate").click(() => {
                this.newEstimate();
            });

            $("#newEffort").click(() => {
                this.newEffort();
            });
        });
    }

    private newEstimate() {
        let url = document["urls"].API.estimate.post.replace(":issueId", this.issueId);
        this.sendAmount(url, parseInt($("#estimate").val()));
    }

    private newEffort() {
        let url = document["urls"].API.effort.post.replace(":issueId", this.issueId);
        this.sendAmount(url, parseInt($("#effort").val()));
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
            error: (err: any) => {
                alert(err.responseJSON.message);
                $("button").prop("disabled", false);
            }
        };

        $.ajax(settings);
    }
}

Issue.init();