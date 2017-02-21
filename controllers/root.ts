import * as K from "kwyjibo";

@K.Controller("/")
export default class Root {

    @K.Get("/")
    index(context: K.Context) {
        context.response.redirect(K.getRoutes().Frontend.index.get);
    }
}