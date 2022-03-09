import 'modals/alert_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import { Button } from 'construct-ui';

const AlertModal = {
  confirmExit: async () => true,
  view: (vnode) => {
    const alertText = vnode.attrs.text;
    const primaryButton = vnode.attrs.primaryButton || 'Continue';
    return m(
      '.AlertModal',
      {
        onclick: (e) => {
          e.preventDefault();
          e.stopPropagation();
        },
        onmousedown: (e) => {
          e.preventDefault();
          e.stopPropagation();
        },
      },
      [
        m('.compact-modal-body', [m('h3', alertText)]),
        m('.compact-modal-actions', [
          m(Button, {
            intent: 'primary',
            rounded: true,
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
        ]),
      ]
    );
  },
};

export const alertModalWithText = (text: string, primaryButton?: string) => {
  return async (): Promise<boolean> => {
    return new Promise((resolve) => {
      app.modals.create({
        modal: AlertModal,
        data: { text, primaryButton },
      });
    });
  };
};
