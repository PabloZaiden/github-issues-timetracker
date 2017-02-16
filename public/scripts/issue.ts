
$(document).ready(() => {
    $.get(
        "/Frontend/urls",
        (data) => {
            document["urls"] = data;
            $("button").prop("disabled", false);
        });
});

function newEstimate(issueId: string) {
    sendAmount(document["urls"].API.estimate.post.replace(":issueId", issueId), parseInt($("#estimate").val()));
}

function newEffort(issueId: string) {
    sendAmount(document["urls"].API.effort.post.replace(":issueId", issueId), parseInt($("#effort").val()));
}

function sendAmount(url: string, amount: number) {
    $("button").prop("disabled", true);

    let settings: JQueryAjaxSettings = {
        url: url,
        method: "POST",
        data: {amount: amount},
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