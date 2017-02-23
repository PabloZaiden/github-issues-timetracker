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

            $("button.remove.estimate").click((event) => {
                this.removeEstimate(event.target);
            });

            $("button.remove.effort").click((event) => {
                this.removeEffort(event.target);
            });

            $("#newEstimate").click(() => {
                this.newEstimate();
            });

            $("#newEffort").click(() => {
                this.newEffort();
            });
        });
    }

    private removeEstimate(element: Element) {
        let url = document["urls"].API.removeEstimate.delete;
        this.removeAmount(element, url);
    }

    private removeEffort(element: Element) {
        let url = document["urls"].API.removeEffort.delete;
        this.removeAmount(element, url);
    }

    private removeAmount(element: Element, url: string) {
        $("button").prop("disabled", true);

        let amount = $(element).attr("amount");

        url = url.replace(":issueId", this.issueId).replace(":amount", amount);

        let settings: JQueryAjaxSettings = {
            url: url,
            method: "DELETE",
            success: (data) => {
                location.reload(true);
            },
            error: (err: any) => {
                this.processError(err);
            }
        };

        $.ajax(settings);

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
                this.processError(err);
            }
        };

        $.ajax(settings);
    }

    private processError(err: any) {
        if (err.responseJSON) {
            alert(err.responseJSON.message);
        } else if (err.reponseText) {
            alert(err.reponseText);
        } else {
            alert("Error");
        }
        $("button").prop("disabled", false);
    }
}

Issue.init();