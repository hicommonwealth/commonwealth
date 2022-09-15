import m from 'mithril';
import $ from 'jquery';

// import FunctionDetails from "./FunctionDetails";
import { AbiFunction } from 'client/scripts/helpers/types';
import { FunctionList } from "./function_list";
// import FunctionCall from "../function-call/FunctionCall";

type FunctionInfoAttrs = {
    abi_functions: AbiFunction[];
}

export class FunctionInfo implements m.ClassComponent<FunctionInfoAttrs> {

    oninit(vnode) {
        return null;
    }

    view(vnode) {
        const { abi_functions } = vnode.attrs;

        return (
            <div>
                <FunctionList fns={abi_functions}/>
            </div>
        );
    }
}