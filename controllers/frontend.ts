import {DocController, DocAction, Get, Post, Context, ActionMiddleware, Controller} from "kwyjibo";
import * as K from "kwyjibo";
import App from "../app";
import Github from "../service/githubService";


@Controller("/frontend")
@DocController("Sample frontend Controller.")
class Frontend {

    @Get("/")
    index(context: Context): void {
        context.response.redirect(K.getActionRoute(Frontend, "projects"));
    }

    @Get()
    projects(context: Context): SuperRenderable {
        let gh = new Github();

        let projects = gh.getProjects();    

        return {
            $render_view: "projects",
            projects: projects
        };
    }
}

export interface SuperRenderable extends K.Renderable {
    [key: string]: any;
}