function newEstimate(url) {
    sendAmount(url, parseInt($("#estimate").val()));
}
function newEffort(url) {
    sendAmount(url, parseInt($("#effort").val()));
}
function sendAmount(url, amount) {
    $("button").prop("disabled", true);
    let settings = {
        url: url,
        method: "POST",
        data: { amount: amount },
        success: (data) => {
            window.location.href = window.location.href;
        },
        error: (err) => {
            alert(err.status);
            $("button").prop("disabled", false);
        }
    };
    $.ajax(settings);
}
//# sourceMappingURL=issue.js.map