/* @jsx m */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import m from 'mithril';
import $ from 'jquery';
import { Button } from 'construct-ui';

import 'modals/alert_modal.scss';

import app from 'state';

const AlertModal = {
  confirmExit: async () => true,
  view(vnode) {
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
          <Button
            intent="primary"
            rounded={true}
            onclick={(e) => {
              e.preventDefault();
              $(e.target).trigger('modalcomplete');
              setTimeout(() => {
                $(e.target).trigger('modalexit');
              }, 0);
            }}
            oncreate={(vvnode) => {
              $(vvnode.dom).focus();
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
