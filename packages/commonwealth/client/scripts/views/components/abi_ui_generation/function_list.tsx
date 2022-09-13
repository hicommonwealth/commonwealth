import m from 'mithril';
import $ from 'jquery';

import { FunctionListAttrs } from 'views/pages/create_community/types';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWRadioGroup } from '../component_kit/cw_radio_group';
// import { FunctionItem } from "./function_item";

type FunctionListState = {
    selectedFnIdx: number;
}

export class FunctionList implements m.ClassComponent<FunctionListAttrs> {
    private state: FunctionListState = {
        selectedFnIdx: null,
    };

    oninit(vnode) {
        return null;
    }

    view(vnode) {
        return (
            <div>
                <h1>Functions (arity):</h1>
                <div shadow={false}>
                    <CWCard>
                    {vnode.attrs.fns.map((fn, i) => (
                        <FunctionItem
                        fn={fn}
                        key={i + fn.name}
                        isActive={this.state.selectedFnIdx === i}
                        onclick={async () => {
                            this.state.selectedFnIdx = i;
                        }}
                        />
                    ))}
                    </CWCard>
                    <div class="members-container">
                        <CWRadioGroup
                            name="members/mods"
                            options={vnode.attrs.fns.map((fn, i) => ({ label: fn.name, value: fn }))}
                            toggledOption={this.state.selectedFnIdx}
                            onchange={(e) => {
                                this.state.selectedFnIdx = e.target;
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }
};