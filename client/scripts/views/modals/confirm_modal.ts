import 'modals/confirm_modal.scss';

import { default as m } from 'mithril';
import { default as $ } from 'jquery';
import app from 'state';

export const confirmationModalWithText = (text) => {
  return async () : Promise<boolean> => {
    let confirmed = false;
    return new Promise((resolve) => {
      app.modals.create({
        modal: ConfirmModal,
        data: { text: text },
        completeCallback: () => confirmed = true,
        exitCallback: () => resolve(confirmed)
      });
    });
  };
};

const ConfirmModal = {
  confirmExit: async () => true,
  view: (vnode) => {
    const confirmText = vnode.attrs.text || 'Are you sure?';
    return m('.ConfirmModal', [
      m('.compact-modal-body', [
        m('h3', confirmText),
      ]),
      m('.compact-modal-actions', [
        m('button', {
          type: 'submit',
          onclick: (e) => {
            e.preventDefault();
            $(vnode.dom).trigger('modalcomplete');
            setTimeout(() => {
              $(vnode.dom).trigger('modalexit');
            }, 0);
          },
          oncreate: (vnode) => {
            $(vnode.dom).focus();
          }
        }, 'Yes'),
        m('button', {
          onclick: (e) => {
            e.preventDefault();
            $(vnode.dom).trigger('modalexit');
          }
        }, 'Cancel'),
      ]),
    ]);
  }
};

export default ConfirmModal;
