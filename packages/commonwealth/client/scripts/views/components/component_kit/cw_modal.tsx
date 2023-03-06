/* @jsx m */

import ClassComponent from 'class_component';

import 'components/component_kit/cw_modal.scss';
import $ from 'jquery';
// eslint-disable-next-line
import m from 'mithril';
import { CWIconButton } from './cw_icon_button';
import type { IconButtonTheme } from './cw_icons/types';
import { breakpointFnValidator, getClasses } from './helpers';

import { ComponentType } from './types';

type ModalAttrs = {
  onclick: (
    spec: any,
    confirmExit: () => void,
    exitCallback: () => void
  ) => void;
  oncreatemodal: (
    spec: any,
    confirmExit: () => void,
    completeCallback: () => void,
    exitCallback: () => void,
    vnode: m.Vnode<ModalAttrs>
  ) => void;
  modalType: 'centered' | 'fullScreen';
  spec: any; // TODO Gabe 2/2/22 - What is a spec?
  breakpointFn?: (width: number) => boolean;
  className?: string;
};

export class CWModal extends ClassComponent<ModalAttrs> {
  private modalTypeState: string;

  oncreate(vnode: m.Vnode<ModalAttrs>) {
    const { spec, oncreatemodal } = vnode.attrs;
    const completeCallback = spec.completeCallback || (() => undefined);
    const exitCallback = spec.exitCallback || (() => undefined);
    const confirmExit = spec.modal.confirmExit || (() => true);

    oncreatemodal(spec, confirmExit, completeCallback, exitCallback, vnode);
  }

  oninit(vnode: m.Vnode<ModalAttrs>) {
    const { modalType, breakpointFn } = vnode.attrs;
    this.modalTypeState = modalType || 'centered';

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
  }

  onremove(vnode: m.Vnode<ModalAttrs>) {
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

  view(vnode: m.Vnode<ModalAttrs>) {
    const { onclick, spec, className } = vnode.attrs;

    const exitCallback = spec.exitCallback || (() => undefined);
    const confirmExit = spec.modal.confirmExit || (() => true);

    return (
      <div class={ComponentType.Modal}>
        <div
          class="modal-overlay"
          onclick={() => onclick(spec, confirmExit, exitCallback)}
        >
          <div
            class={getClasses<{
              isFullScreen: boolean;
              [key: string]: boolean;
            }>(
              {
                isFullScreen: this.modalTypeState === 'fullScreen',
                [className]: !!className,
              },
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

type ModalExitButtonAttrs = {
  disabled?: boolean;
  iconButtonTheme?: IconButtonTheme;
};

export class ModalExitButton extends ClassComponent<ModalExitButtonAttrs> {
  view(vnode: m.Vnode<ModalExitButtonAttrs>) {
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
