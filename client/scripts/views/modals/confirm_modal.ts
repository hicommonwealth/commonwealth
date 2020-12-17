import 'modals/confirm_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import { Button } from 'construct-ui';

const ConfirmModal = {
  confirmExit: async () => true,
  view: (vnode) => {
    const confirmText = vnode.attrs.prompt || 'Are you sure?';
    const primaryButton = vnode.attrs.primaryButton || 'Yes';
    const secondaryButton = vnode.attrs.secondaryButton || 'Cancel';
    return m('.ConfirmModal', {
      onclick: (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      onmousedown: (e) => {
        e.preventDefault();
        e.stopPropagation();
      }
    }, [
      m('.compact-modal-body', [
        m('h3', confirmText),
      ]),
      m('.compact-modal-actions', [
        m(Button, {
          intent: 'primary',
          onclick: (e) => {
            e.preventDefault();
            $(e.target).trigger('modalcomplete');
            setTimeout(() => {
              $(e.target).trigger('modalexit');
            }, 0);
          },
          oncreate: (vvnode) => {
            $(vvnode.dom).focus();
          },
          label: primaryButton,
        }),
        m(Button, {
          intent: 'none',
          onclick: (e) => {
            e.preventDefault();
            $(e.target).trigger('modalexit');
          },
          label: secondaryButton,
        }),
      ]),
    ]);
  }
};

export const confirmationModalWithText = (prompt: string, primaryButton?: string, secondaryButton?: string) => {
  return async () : Promise<boolean> => {
    let confirmed = false;
    return new Promise((resolve) => {
      app.modals.create({
        modal: ConfirmModal,
        data: { prompt, primaryButton, secondaryButton },
        completeCallback: () => { confirmed = true; },
        exitCallback: () => resolve(confirmed)
      });
    });
  };
};

export default ConfirmModal;
