function saySomething(message: string) {
    $(document).ready(() => {
        $("body").append(`<p>${message}</p>`);
    });
}