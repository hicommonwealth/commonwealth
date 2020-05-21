import m from 'mithril';
import app from 'state';
import { TextInputFormField, DropdownFormField } from 'views/components/forms';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { createTXModal } from 'views/modals/tx_signing_modal';

interface IActionFormAttrs {
  isTextInput?: boolean;
  actionName: string;
  actionHandler?: any;
  placeholder: string;
  onChangeHandler?: any;
  titleMsg: string;
  options?: any;
  choices?: any;
  errorMsg: string;
  defaultValue?: any;
}

interface IActionFormState {
  data: any;
  sending: boolean;
  error: any;
}

const ActionForm: m.Component<IActionFormAttrs, IActionFormState> = {
  view: (vnode) => {
    const inputComponent = (vnode.attrs.isTextInput)
      ? m(TextInputFormField, {
        title: vnode.attrs.titleMsg,
        options: {
          placeholder: vnode.attrs.placeholder,
          callback: (result) => { vnode.state.data = vnode.attrs.onChangeHandler(result); },
        },
      })
      : m(DropdownFormField, {
        title: vnode.attrs.titleMsg,
        options: vnode.attrs.options,
        choices: vnode.attrs.choices,
        callback: (result) => { vnode.state.data = vnode.attrs.onChangeHandler(result); },
      });

    return m('.NewStashForm', [
      (vnode.attrs.onChangeHandler) ? inputComponent : m('h4', vnode.attrs.titleMsg),
      (vnode.attrs.actionHandler) && m('button.formular-button-primary', {
        class: app.vm.activeAccount ? '' : 'disabled',
        onclick: (e) => {
          e.preventDefault();
          const value = vnode.state.data || vnode.attrs.defaultValue;
          if (!value) return;
          const sender = app.vm.activeAccount;
          try {
            vnode.state.sending = true;
            if (sender instanceof SubstrateAccount) {
              createTXModal(vnode.attrs.actionHandler(value))
                .then(() => {
                  vnode.state.sending = false;
                  m.redraw();
                })
                .catch(e => {
                  vnode.state.sending = false;
                  m.redraw();
                });
            } else {
              throw new Error(vnode.attrs.errorMsg);
            }
          } catch (e) {
            vnode.state.error = e.message;
            vnode.state.sending = false;
            m.redraw();
          }
        },
      }, vnode.attrs.actionName),
    ]);
  },
};

export default ActionForm;
