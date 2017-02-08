import {Controller, DocController, DocAction, Get, Context} from "kwyjibo";
import * as K from "kwyjibo";

@K.Dev()
@Controller("/dev")
@DocController("This controller is only mounted if NODE_ENV == development")
export default class Dev {

    @DocAction("Does something, only for dev")
    doSomething(context: Context): Object {
        return { result: "This can only be hit in dev" };
    }

    @DocAction("Shows the app documentation")
    docs(): string {
        return K.getDocsAsHTML();
    }
}