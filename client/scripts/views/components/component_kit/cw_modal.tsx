/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import 'components/component_kit/cw_modal.scss';

import { ComponentType } from './types';

type ModalAttrs = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spec: any; // TODO Gabe 2/2/22 - What is a spec?
  onclick: () => void;
  oncreate: () => void;
};

export class CWModal implements m.ClassComponent<ModalAttrs> {
  view(vnode) {
    const { spec, oncreate, onclick } = vnode.attrs;
    const completeCallback = spec.completeCallback || (() => undefined);
    const exitCallback = spec.exitCallback || (() => undefined);
    const confirmExit = spec.modal.confirmExit || (() => true);

    return (
      <div
        class={ComponentType.Modal}
        oncreate={oncreate.bind(
          this,
          spec,
          confirmExit,
          completeCallback,
          exitCallback
        )}
      >
        <div class="overlay" onclick={onclick}>
          <div
            class="popup"
            onclick={(e) => {
              e.stopPropagation();
            }}
          >
            {vnode.children}
          </div>
        </div>
      </div>
    );
  }
}

export class CompactModalExitButton implements m.ClassComponent {
  view() {
    return (
      <div
        class="CompactModalExitButton"
        onclick={(e) => {
          e.preventDefault();
          $(e.target).trigger('modalexit');
        }}
      >
        ×
      </div>
    );
  }
}
