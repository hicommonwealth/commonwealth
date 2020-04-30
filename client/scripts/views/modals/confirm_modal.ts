import 'modals/confirm_modal.scss';

import { default as m } from 'mithril';
import { default as $ } from 'jquery';
import app from 'state';
import { Button } from 'construct-ui';

const ConfirmModal = {
  confirmExit: async () => true,
  view: (vnode) => {
    const confirmText = vnode.attrs.text || 'Are you sure?';
    return m('.ConfirmModal', [
      m('.compact-modal-body', [
        m('h3', confirmText),
      ]),
      m('.compact-modal-actions', [
        m(Button, {
          intent: 'primary',
          onclick: (e) => {
            e.preventDefault();
            $(vnode.dom).trigger('modalcomplete');
            setTimeout(() => {
              $(vnode.dom).trigger('modalexit');
            }, 0);
          },
          oncreate: (vvnode) => {
            $(vvnode.dom).focus();
          },
          label: 'Yes',
        }),
        m(Button, {
          intent: 'none',
          onclick: (e) => {
            e.preventDefault();
            $(vnode.dom).trigger('modalexit');
          },
          label: 'Cancel',
        }),
      ]),
    ]);
  }
};

export const confirmationModalWithText = (text) => {
  return async () : Promise<boolean> => {
    let confirmed = false;
    return new Promise((resolve) => {
      app.modals.create({
        modal: ConfirmModal,
        data: { text },
        completeCallback: () => { confirmed = true; },
        exitCallback: () => resolve(confirmed)
      });
    });
  };
};

export default ConfirmModal;
