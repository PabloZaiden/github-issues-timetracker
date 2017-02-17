class Milestone {
    private static instance: Milestone;
    static init() {
        Milestone.instance = new Milestone();
    }

    constructor() {
        $(document).ready(() => {
        });
    }
}

Milestone.init();