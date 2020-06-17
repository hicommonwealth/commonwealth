import 'modals/input_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import { Button } from 'construct-ui';

const InputModal = {
  confirmExit: async () => true,
  view: (vnode) => {
    const defaultValue = vnode.attrs.value;
    const placeholder = vnode.attrs.placeholder;
    const promptTitle = vnode.attrs.title;
    const promptText = vnode.attrs.text;
    return m('form.InputModal', [
      m('.compact-modal-body', [
        m('h3', promptTitle),
        promptText && m('p', promptText),
        m('input[type="text"]', {
          placeholder,
          oncreate: (vvnode) => {
            if (defaultValue !== undefined) $(vvnode.dom).val(defaultValue);
            $(vvnode.dom).focus();
          },
        }),
      ]),
      m('.compact-modal-actions', [
        m(Button, {
          label: 'Submit',
          type: 'submit',
          intent: 'primary',
          onclick: (e) => {
            e.preventDefault();
            vnode.attrs.retval.text = $(vnode.dom).find('input[type="text"]').val();
            $(vnode.dom).trigger('modalcomplete');
            setTimeout(() => {
              $(vnode.dom).trigger('modalexit');
            }, 0);
          }
        }),
        m(Button, {
          label: 'Cancel',
          intent: 'none',
          onclick: (e) => {
            e.preventDefault();
            $(vnode.dom).trigger('modalexit');
          }
        }),
      ]),
    ]);
  }
};

export const inputModalWithText = (title, text?, placeholder?, value?) => {
  return async () : Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      // Since it's impossible to return a value via a triggered event, we need
      // some other way. This seems preferable to creating a global in this file
      const retval = { text: undefined };
      app.modals.create({
        modal: InputModal,
        data: { title, text, placeholder, value, retval },
        completeCallback: (e) => null,
        exitCallback: (e) => resolve(retval.text),
      });
    });
  };
};

export default InputModal;
