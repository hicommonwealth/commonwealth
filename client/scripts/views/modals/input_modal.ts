import 'modals/input_modal.scss';

import { default as m } from 'mithril';
import { default as $ } from 'jquery';
import app from 'state';

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

const InputModal = {
  confirmExit: async () => true,
  view: (vnode) => {
    const defaultValue = vnode.attrs.value;
    const placeholder = vnode.attrs.placeholder;
    const promptTitle = vnode.attrs.title;
    const promptText = vnode.attrs.text;
    return m('.InputModal', [
      m('.compact-modal-body', [
        m('h3', promptTitle),
        promptText && m('p', promptText),
        m('input[type="text"]', {
          placeholder: placeholder,
          oncreate: (vnode) => {
            if (defaultValue !== undefined) $(vnode.dom).val(defaultValue);
            $(vnode.dom).focus();
          }
        }),
      ]),
      m('.compact-modal-actions', [
        m('button', {
          type: 'submit',
          onclick: (e) => {
            e.preventDefault();
            vnode.attrs.retval.text = $(vnode.dom).find('input[type="text"]').val();
            $(vnode.dom).trigger('modalcomplete');
            setTimeout(() => {
              $(vnode.dom).trigger('modalexit');
            }, 0);
          }
        }, 'Submit'),
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

export default InputModal;
