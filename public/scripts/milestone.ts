import { Dictionary, DayEntry } from "../../models/api";

class Milestone {
    private milestone: number;
    private repo: string;
    private org: string;

    private burndown: JQuery;

    private static instance: Milestone;
    static init() {
        Milestone.instance = new Milestone();
    }

    constructor() {
        $(document).ready(() => {
            this.milestone = parseInt($("#milestone").val());
            this.repo = $("#repo").val();
            this.org = $("#org").val();
            this.burndown = $("#burndown");

            this.burndown.hide();

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

    drawBurnDown(data: Dictionary<DayEntry>) {
        let values = [];
        for (let key in data) {
            let pending = data[key].currentEstimate - data[key].totalEffort;

            if (pending < 0) {
                pending = 0;
            }

            if (values.length != 0 || pending > 0) {
                values.push({ x: new Date(key), y: pending });
            }
        }

        if (values.length == 0) {
            return;
        }

        this.burndown.show();

        var chart = new CanvasJS.Chart("burndown", {
            title: {
                text: "Burndown chart"
            },
            data: [{
                type: "line",
                dataPoints: values
            }],
            axisX: {
                valueFormatString: "YYYY-MM-DD",
                interval: 1,
                intervalType: "day",
                title: "Date"
            },
            axisY: {
                title: "Pending Hours",

            }
        });
        chart.render();
    }

    private getXPoint(date: Date) {
        return `${date.getFullYear()}-${this.getMonth(date)}-${this.getDayOfTheMonth(date)}`;
    }

    private getMonth(date: Date) {
        let month = date.getMonth() + 1;

        if (month < 10) {
            return "0" + month.toString();
        } else {
            return month.toString();
        }
    }

    private getDayOfTheMonth(date: Date) {
        let day = date.getDate();
        if (day < 10) {
            return "0" + day.toString();
        } else {
            return day.toString();
        }
    }
}

Milestone.init();
declare let CanvasJS: any;