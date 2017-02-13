import {DocController, DocAction, Get, Post, Context, ActionMiddleware, Controller} from "kwyjibo";
import * as K from "kwyjibo";
import App from "../app";
import Github from "../service/githubService";


@Controller("/frontend")
@K.Middleware(App.authorize)
@DocController("Sample frontend Controller.")
class Frontend {

    @Get("/")
    index(context: Context): void {
        context.response.redirect(K.getActionRoute(Frontend, "loggedIn"));
    }

    @Get()
    loggedIn(context: Context) {
        return context.request.user;
    }

    @Get()
    projects(context: Context): SuperRenderable {
        /*
        let gh = new Github();

        let projects = gh.getProjects();    

        return {
            $render_view: "projects",
            projects: projects
        };
        */
        return undefined;
    }
}

export interface SuperRenderable extends K.Renderable {
    [key: string]: any;
}