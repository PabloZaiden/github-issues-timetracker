function newEstimate(url: string) {
    sendAmount(url, parseInt($("#estimate").val()));
}

function newEffort(url: string) {
    sendAmount(url, parseInt($("#effort").val()));
}

function sendAmount(url: string, amount: number) {
    $("button").prop("disabled", true);

    let settings: JQueryAjaxSettings = {
        url: url,
        method: "POST",
        data: {amount: amount},
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