/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import 'modals/alert_modal.scss';

import app from 'state';
import { CWButton } from '../components/component_kit/cw_button';

const AlertModal = {
  confirmExit: async () => true,
  view(vnode: m.Vnode<{ text: string; primaryButton?: string }>) {
    const alertText = vnode.attrs.text;
    const primaryButton = vnode.attrs.primaryButton || 'Continue';

    return (
      <div
        class="ConfirmModal"
        onclick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onmousedown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div class="compact-modal-body">
          <h3>{alertText}</h3>
        </div>
        <div class="compact-modal-actions">
          <CWButton
            onclick={(e) => {
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
    });
  };
};
