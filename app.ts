import { SecurityProvider, GithubSecurityProvider } from 'github-securityprovider-connect';
import * as Express from "express";
import * as CookieParser from "cookie-parser";
import * as BodyParser from "body-parser";
import * as Http from "http";
import * as K from "kwyjibo";
import Session = require("cookie-session");
import * as Passport from "passport";
import * as LagashLogger from "lagash-logger";

export default class App {

    private static port: number = normalizePort(process.env.port || "3000");
    private static server: Http.Server;
    private static express: Express.Express;
    private static isDevelopment = false;
    private static securityProvider: SecurityProvider;

    public static get authorize(): Express.Handler {
        if (process.env.DISABLE_AUTH) {
            return (req, res, next) => next();
        } else {
            return App.securityProvider.getAuthorizeMiddleware();
        }
    }

    public static get authenticate(): Express.Handler {
        return App.securityProvider.getAuthenticateMiddleware()
    }

    public static init(): void {
        if (process.env.NODE_ENV === "development") {
            App.isDevelopment = true;
        }

        App.express = Express();

        App.express.set("view engine", "hbs");
        let hbs = require("hbs");

        hbs.registerPartials(__dirname + "/views/partials");

        App.express.set("trust proxy", true);
        App.express.use(BodyParser.json());
        App.express.use(BodyParser.urlencoded({ extended: false }));
        App.express.use(CookieParser());

        let sessionSecret = process.env.SESSION_SECRET;
        if (!sessionSecret) {
            throw new Error("Missing SESSION_SECRET");
        }

        let callbackUrl: string = process.env.GITHUB_CALLBACK_URL;
        if (callbackUrl == undefined) {
            callbackUrl = "";
        }

        let isHttps = callbackUrl.toLowerCase().startsWith("https");

        App.express.use(Session({
            secureProxy: isHttps,
            name: "session",
            secret: sessionSecret,
            httpOnly: true
        }));
        App.express.use(Passport.initialize());
        App.express.use(Passport.session());

        Passport.serializeUser(function (user, done) {
            done(null, user);
        });

        Passport.deserializeUser(function (user: any, done) {
            if (user == undefined || user.accessToken == null) {
                user = undefined;
            }

            done(null, user);
        });

        App.securityProvider = new GithubSecurityProvider("/auth/callback");
    }

    public static start(): void {

        // Create HTTP server.
        App.server = Http.createServer(App.express);

        App.express.use(Express.static("public"));

        // Init all Kwyjibo controllers, tests, loggers and error handlers
        K.initialize(App.express);

        // Listen on provided port, on all network interfaces.
        App.express.set("port", App.port);
        App.server.listen(App.port);
        App.server.on("error", App.onError);
        App.server.on("listening", App.onListening);
    }

    private static onError(error: any): void {

        if (error.syscall !== "listen") {
            throw error;
        }

        let bind = typeof App.port === "string" ? ("Pipe " + App.port) : ("Port " + App.port);

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case "EACCES":
                console.error(bind + " requires elevated privileges");
                process.exit(1);
                break;
            case "EADDRINUSE":
                console.error(bind + " is already in use");
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    private static onListening(): void {
        let addr = App.server.address();
        let bind = typeof addr === "string" ?
            "pipe " + addr :
            "port " + addr.port;

        if (App.isDevelopment) {
            console.log("Listening on " + bind);
        }
    }
}

function normalizePort(val: string): any {
    let port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

process.on('uncaughtException', (err: any) => {
    console.error(err);
});

App.init();
App.start();
