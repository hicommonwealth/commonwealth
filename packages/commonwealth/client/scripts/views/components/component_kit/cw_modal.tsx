/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import 'components/component_kit/cw_modal.scss';
import $ from 'jquery';
import { CWIconButton } from './cw_icon_button';
import type { IconButtonTheme } from './cw_icons/types';
import { breakpointFnValidator, getClasses } from './helpers';

import { ComponentType } from './types';

type ModalAttrs = {
  onClick: (
    spec: any,
    confirmExit: () => void,
    exitCallback: () => void
  ) => void;
  oncreatemodal: (
    spec: any,
    confirmExit: () => void,
    completeCallback: () => void,
    exitCallback: () => void,
    vnode: ResultNode<ModalAttrs>
  ) => void;
  modalType: 'centered' | 'fullScreen';
  spec: any; // TODO Gabe 2/2/22 - What is a spec?
  breakpointFn?: (width: number) => boolean;
};

export class CWModal extends ClassComponent<ModalAttrs> {
  private modalTypeState: string;

  oncreate(vnode: ResultNode<ModalAttrs>) {
    const { spec, oncreatemodal } = vnode.attrs;
    const completeCallback = spec.completeCallback || (() => undefined);
    const exitCallback = spec.exitCallback || (() => undefined);
    const confirmExit = spec.modal.confirmExit || (() => true);

    oncreatemodal(spec, confirmExit, completeCallback, exitCallback, vnode);
  }

  oninit(vnode: ResultNode<ModalAttrs>) {
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

  onremove(vnode: ResultNode<ModalAttrs>) {
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

  view(vnode: ResultNode<ModalAttrs>) {
    const { onClick, spec } = vnode.attrs;

    const exitCallback = spec.exitCallback || (() => undefined);
    const confirmExit = spec.modal.confirmExit || (() => true);

    return (
      <div className={ComponentType.Modal}>
        <div
          className="modal-overlay"
          onClick={() => onClick(spec, confirmExit, exitCallback)}
        >
          <div
            className={getClasses<{ isFullScreen: boolean }>(
              { isFullScreen: this.modalTypeState === 'fullScreen' },
              'modal-container'
            )}
            onClick={(e) => {
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
  view(vnode: ResultNode<ModalExitButtonAttrs>) {
    const { disabled, iconButtonTheme } = vnode.attrs;

    return (
      // class is to avoid classname collisions when positioning the button,
      // since .IconButton will often be used in the same vicinity
      <div className="ModalExitButton">
        <CWIconButton
          disabled={disabled}
          iconButtonTheme={iconButtonTheme}
          iconName="close"
          onClick={(e) => {
            e.preventDefault();
            $(e.target).trigger('modalexit');
          }}
        />
      </div>
    );
  }
}
