import 'modals/update_delegate_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import { FormLabel, FormGroup, Input, Button } from 'construct-ui';

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
        m(FormGroup, [
          m(FormLabel, 'Delegate Key (update your selected delegate)'),
          m(Input, {
            value: vnode.state.newDelegateKey,
            oncreate: (vvnode) => {
              $(vvnode.dom).focus();
            },
            oninput: (e) => {
              const result = (e.target as any).value;
              vnode.state.newDelegateKey = result;
            }
          }),
        ]),
        m(Button, {
          intent: 'primary',
          type: 'submit',
          onclick: (e) => {
            e.preventDefault();
            vnode.attrs.account.updateDelegateKeyTx(vnode.state.newDelegateKey)
              .then((result) => {
                $(vnode.dom).trigger('modalforceexit');
                m.redraw();
              })
              .catch((err) => notifyError(err.toString()));
          },
          label: 'Update Delegate'
        }),
      ]),
    ]);
  }
};

export default UpdateDelegateModal;
