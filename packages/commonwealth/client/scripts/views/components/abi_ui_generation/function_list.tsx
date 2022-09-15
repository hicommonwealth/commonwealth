import m from 'mithril';
import $ from 'jquery';

import { CWCard } from 'views/components/component_kit/cw_card';
import { CWRadioGroup } from '../component_kit/cw_radio_group';

const displayFunctions = (fns) => {
    return fns.map((fn, i) => {
      return (
        <div class="function-container">
          <div class="fn-name">{fn}</div>
        </div>
      );
    });
  };

export class FunctionList implements m.ClassComponent<{fns: []}> {
    oninit(vnode) {
        return null;
    }

    view(vnode) {
        return (
            <div>
                <h1>Functions (arity):</h1>
                {displayFunctions(vnode.attrs.fns)}
            </div>
        );
    }
};