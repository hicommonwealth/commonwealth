import 'modals/update_delegate_modal.scss';

import { default as m } from 'mithril';
import { default as $ } from 'jquery';
import { TextInputFormField } from 'views/components/forms';
import MolochMember from 'controllers/chain/ethereum/moloch/member';
import { notifyError } from 'controllers/app/notifications';

interface IAttrs {
  account: MolochMember;
  delegateKey: string;
}

interface IState {
  newDelegateKey: string;
}

const UpdateDelegateModal: m.Component<IAttrs, IState> = {
  oninit: (vnode: m.Vnode<IAttrs, IState>) => {
    vnode.state.newDelegateKey = vnode.attrs.delegateKey;
  },
  view: (vnode: m.VnodeDOM<IAttrs, IState>) => {
    return m('.UpdateDelegateModal', [
      m('.header', 'Update Delegate'),
      m('.compact-modal-body', [
        m(TextInputFormField, {
          title: 'Delegate Key',
          subtitle: 'Update your selected delegate.',
          options: {
            value: vnode.state.newDelegateKey,
            oncreate: (vnode) => {
              $(vnode.dom).focus();
            }
          },
          callback: (val) => {
            vnode.state.newDelegateKey = val.toString();
          }
        }),
        m('button', {
          type: 'submit',
          onclick: (e) => {
            e.preventDefault();
            vnode.attrs.account.updateDelegateKeyTx(vnode.state.newDelegateKey)
            .then((result) => {
              $(vnode.dom).trigger('modalforceexit');
              m.redraw();
            })
            .catch((err) => notifyError(err.toString()));
          }
        }, 'Update Delegate'),
      ]),
    ]);
  }
};

export default UpdateDelegateModal;
