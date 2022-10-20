/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import 'components/component_kit/cw_modal.scss';

import { ComponentType } from './types';
import { CWIconButton } from './cw_icon_button';
import { IconButtonTheme } from './cw_icons/types';
import { getClasses } from './helpers';

type ModalSpec = {
  confirmExit: () => void;
  completeCallback: () => void;
  exitCallback: () => void;
  modal: m.Vnode;
  data: { isFullScreen?: boolean };
};

type ModalAttrs = {
  onclick: () => void;
  oncreatemodal: (
    spec: ModalSpec,
    confirmExit: () => void,
    completeCallback: () => void,
    exitCallback: () => void,
    vnode: m.VnodeDOM
  ) => void;
  spec: ModalSpec;
};

export class CWModal implements m.ClassComponent<ModalAttrs> {
  oncreate(vnode: m.VnodeDOM<ModalAttrs, this>) {
    const { spec, oncreatemodal } = vnode.attrs;
    const completeCallback = spec.completeCallback || (() => undefined);
    const exitCallback = spec.exitCallback || (() => undefined);
    const confirmExit = spec.confirmExit || (() => true);

    oncreatemodal(spec, confirmExit, completeCallback, exitCallback, vnode);
  }

  view(vnode) {
    const { onclick, spec } = vnode.attrs;

    const exitCallback = spec.exitCallback || (() => undefined);
    const confirmExit = spec.modal.confirmExit || (() => true);

    return (
      <div class={ComponentType.Modal}>
        <div
          class="modal-overlay"
          onclick={() => onclick(spec, confirmExit, exitCallback)}
        >
          <div
            class={getClasses<{ isFullScreen: boolean }>(
              { isFullScreen: spec.data.isFullScreen },
              'modal-container'
            )}
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

export class ModalExitButton
  implements
    m.ClassComponent<{ disabled?: boolean; iconButtonTheme: IconButtonTheme }>
{
  view(vnode) {
    const { disabled, iconButtonTheme } = vnode.attrs;

    return (
      // class is to avoid classname collisions when positioning the button,
      // since .IconButton will often be used in the same vicinity
      <div class="ModalExitButton">
        <CWIconButton
          disabled={disabled}
          iconButtonTheme={iconButtonTheme}
          iconName="close"
          onclick={(e) => {
            e.preventDefault();
            $(e.target).trigger('modalexit');
          }}
        />
      </div>
    );
  }
}
