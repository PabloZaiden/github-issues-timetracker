$(document).ready(() => {
    $.get("/Frontend/urls", (data) => {
        document["urls"] = data;
        $("button").prop("disabled", false);
    });
});
function newEstimate(issueId) {
    sendAmount(document["urls"].API.estimate.post.replace(":issueId", issueId), parseInt($("#estimate").val()));
}
function newEffort(issueId) {
    sendAmount(document["urls"].API.effort.post.replace(":issueId", issueId), parseInt($("#effort").val()));
}
function sendAmount(url, amount) {
    $("button").prop("disabled", true);
    let settings = {
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
//# sourceMappingURL=issue.js.map