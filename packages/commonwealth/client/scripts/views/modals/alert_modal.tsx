import React from 'react';

import { redraw, ResultNode } from 'mithrilInterop';
import $ from 'jquery';

import 'modals/alert_modal.scss';

import app from 'state';
import { CWButton } from '../components/component_kit/cw_button';

const AlertModal = {
  confirmExit: async () => true,
  view(vnode: ResultNode<{ text: string; primaryButton?: string }>) {
    const alertText = vnode.attrs.text;
    const primaryButton = vnode.attrs.primaryButton || 'Continue';

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
          <h3>{alertText}</h3>
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
            label={primaryButton}
          />
        </div>
      </div>
    );
  },
};

export const alertModalWithText = (text: string, primaryButton?: string) => {
  return async (): Promise<boolean> => {
    return new Promise(() => {
      app.modals.create({
        modal: AlertModal,
        data: { text, primaryButton },
      });
      // TODO Add a redraw downstream
      redraw();
    });
  };
};
