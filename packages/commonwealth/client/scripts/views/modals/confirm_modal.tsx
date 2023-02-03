/* @jsx jsx */
import React from 'react';

import $ from 'jquery';
// eslint-disable-next-line @typescript-eslint/no-unused-vars

import { jsx } from 'mithrilInterop';
import type { ResultNode } from 'mithrilInterop';

import 'modals/confirm_modal.scss';

import app from 'state';
import { CWButton } from '../components/component_kit/cw_button';

const ConfirmModal = {
  confirmExit: async () => true,
  view(
    vnode: ResultNode<{
      prompt: string;
      primaryButton?: string;
      secondaryButton?: string;
    }>
  ) {
    const confirmText = vnode.attrs.prompt || 'Are you sure?';
    const primaryButton = vnode.attrs.primaryButton || 'Yes';
    const secondaryButton = vnode.attrs.secondaryButton || 'Cancel';

    return (
      <div
        className="ConfirmModal"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="compact-modal-body">
          <h3>{confirmText}</h3>
        </div>
        <div className="compact-modal-actions">
          <CWButton
            onClick={(e) => {
              e.preventDefault();
              $(e.target).trigger('modalcomplete');
              setTimeout(() => {
                $(e.target).trigger('modalexit');
              }, 0);
            }}
            // oncreate={(vvnode) => {
            //   $(vvnode.dom).focus();
            // }}
            label={primaryButton}
          />
          <CWButton
            buttonType="secondary-blue"
            onClick={(e) => {
              e.preventDefault();
              $(e.target).trigger('modalexit');
            }}
            label={secondaryButton}
          />
        </div>
      </div>
    );
  },
};

export const confirmationModalWithText = (
  prompt: string,
  primaryButton?: string,
  secondaryButton?: string
) => {
  return async (): Promise<boolean> => {
    let confirmed = false;
    return new Promise((resolve) => {
      app.modals.create({
        modal: ConfirmModal,
        data: { prompt, primaryButton, secondaryButton },
        completeCallback: () => {
          confirmed = true;
        },
        exitCallback: () => resolve(confirmed),
      });
    });
  };
};
