import m from 'mithril';
import $ from 'jquery';

// import FunctionDetails from "./FunctionDetails";
import { AbiFunction } from 'client/scripts/helpers/types';
import { FunctionList } from "./function_list";
// import FunctionCall from "../function-call/FunctionCall";

export class FunctionInfo implements m.ClassComponent<{abi_functions: AbiFunction[]}> {

    oninit(vnode) {
        return null;
    }

    view(vnode) {
        const { abi_functions } = vnode.attrs;

        return (
            <div>
                <FunctionList
                    fns={abi_functions}
                />
                {/* <FunctionDetails fn={this.state.selectedFn} />
                <FunctionCall fn={this.state.selectedFn} /> */}
            </div>
        );
    }
}