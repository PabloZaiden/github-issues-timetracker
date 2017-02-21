import * as d3 from "@types/d3";

class Milestone {
    private milestone: number;
    private repo: string;
    private org: string;

    private static instance: Milestone;
    static init() {
        Milestone.instance = new Milestone();
    }

    constructor() {
        $(document).ready(() => {
            this.milestone = parseInt($("#milestone").val());
            this.repo = $("#repo").val();
            this.org = $("#org").val();

            this.loadTimeTrackingData();
        });
    }

    loadTimeTrackingData() {
        let url = document["urls"].API.timeTrackingPerDayByMilestone.get + `?org=${this.org}&repo=${this.repo}&number=${this.milestone}`;
        $.get(
            url,
            undefined,
            (data) => {
                this.drawBurnDown(data);
            }
        );
    }

    drawBurnDown(data: any) {
        let doc: any = document;
        let ctx = doc.getElementById("burndown").getContext("2d");

        var graph: any = new BarGraph(ctx);
        graph.margin = 2;
        graph.width = 450;
        graph.height = 150;
        graph.xAxisLabelArr = []; // = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        let values = [];
        for (let key in data) {
            let pending = data[key].currentEstimate - data[key].totalEffort;
            if (pending < 0) {
                pending = 0;
            }
            if (values.length != 0 || pending > 0) {
                graph.xAxisLabelArr.push(key);
                values.push(pending);
            }
        }

        graph.update(values);
    }
}

Milestone.init();
declare let BarGraph: any;