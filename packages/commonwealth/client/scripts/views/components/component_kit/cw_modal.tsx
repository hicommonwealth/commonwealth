/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import 'components/component_kit/cw_modal.scss';

import { ComponentType } from './types';
import { CWIconButton } from './cw_icon_button';
import { getClasses } from './helpers';
import { IconTheme } from './cw_icons/types';

type ModalAttrs = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onclick: () => void;
  oncreatemodal: () => void;
  modalType: 'centered' | 'fullScreen';
  spec: any; // TODO Gabe 2/2/22 - What is a spec?
};

export class CWModal implements m.ClassComponent<ModalAttrs> {
  oncreate(vnode) {
    const { spec, oncreatemodal } = vnode.attrs;
    const completeCallback = spec.completeCallback || (() => undefined);
    const exitCallback = spec.exitCallback || (() => undefined);
    const confirmExit = spec.modal.confirmExit || (() => true);

    oncreatemodal(spec, confirmExit, completeCallback, exitCallback, vnode);
  }

  view(vnode) {
    const { onclick, modalType = 'centered', spec } = vnode.attrs;

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
              { isFullScreen: modalType === 'fullScreen' },
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
    m.ClassComponent<{ disabled?: boolean; iconButtonTheme: IconTheme }>
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
