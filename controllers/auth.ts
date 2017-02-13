import {Controller, DocController, DocAction, Get, Context} from "kwyjibo";
import * as K from "kwyjibo";
import App from "../app";

@Controller("/auth")
export default class Dev {

    @K.Get()
    @K.ActionMiddleware(App.authenticate)
    callback(context: Context) {
        context.response.redirect("/frontend");
    }
}