/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import 'components/component_kit/cw_modal.scss';

import { ComponentType } from './types';
import { CWIconButton } from './cw_icon_button';
import { breakpointFnValidator, getClasses } from './helpers';
import { IconButtonTheme } from './cw_icons/types';

type ModalAttrs = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onclick: () => void;
  oncreatemodal: () => void;
  modalType: 'centered' | 'fullScreen';
  spec: any; // TODO Gabe 2/2/22 - What is a spec?
  breakpointFn?: (width: number) => boolean;
};

export class CWModal implements m.ClassComponent<ModalAttrs> {
  private modalTypeState: string;

  oncreate(vnode) {
    const { spec, oncreatemodal } = vnode.attrs;
    const completeCallback = spec.completeCallback || (() => undefined);
    const exitCallback = spec.exitCallback || (() => undefined);
    const confirmExit = spec.modal.confirmExit || (() => true);

    oncreatemodal(spec, confirmExit, completeCallback, exitCallback, vnode);
  }

  oninit(vnode) {
    const { modalType } = vnode.attrs;
    this.modalTypeState = modalType || 'centered';
  }

  onremove(vnode) {
    const { breakpointFn } = vnode.attrs;
    if (breakpointFn) {
      // eslint-disable-next-line no-restricted-globals
      removeEventListener('resize', () =>
        breakpointFnValidator(
          this.modalTypeState === 'fullScreen',
          (state: boolean) => {
            this.modalTypeState = state ? 'fullScreen' : 'centered';
          },
          breakpointFn
        )
      );
    }
  }

  view(vnode) {
    const { onclick, spec, breakpointFn } = vnode.attrs;

    const exitCallback = spec.exitCallback || (() => undefined);
    const confirmExit = spec.modal.confirmExit || (() => true);

    if (breakpointFn) {
      // eslint-disable-next-line no-restricted-globals
      addEventListener('resize', () =>
        breakpointFnValidator(
          this.modalTypeState === 'fullScreen',
          (state: boolean) => {
            this.modalTypeState = state ? 'fullScreen' : 'centered';
          },
          breakpointFn
        )
      );
    }

    return (
      <div class={ComponentType.Modal}>
        <div
          class="modal-overlay"
          onclick={() => onclick(spec, confirmExit, exitCallback)}
        >
          <div
            class={getClasses<{ isFullScreen: boolean }>(
              { isFullScreen: this.modalTypeState === 'fullScreen' },
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
