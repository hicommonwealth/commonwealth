import 'modals/token_approval_modal.scss';

import { default as m } from 'mithril';
import { default as $ } from 'jquery';
import { TextInputFormField } from 'views/components/forms';
import MolochMember from 'controllers/chain/ethereum/moloch/member';
import { notifyError } from 'controllers/app/notifications';
import BN from 'bn.js';

interface IAttrs {
  account: MolochMember;
}

interface IState {
  tokensToApprove: string;
}

const TokenApprovalModal: m.Component<IAttrs, IState> = {
  view: (vnode: m.VnodeDOM<IAttrs, IState>) => {

    return m('.TokenApprovalModal', [
      m('.header', 'Approve'),
      m('.compact-modal-body', [
        m(TextInputFormField, {
          title: 'Amount of token to approve',
          subtitle: 'If you want to become a DAO member, you must allow it to handle some of your tokens. Choose the amount.',
          options: {
            value: vnode.state.tokensToApprove,
            oncreate: (vnode) => {
              $(vnode.dom).focus();
            }
          },
          callback: (val) => {
            vnode.state.tokensToApprove = val.toString();
          }
        }),
        m('button', {
          type: 'submit',
          onclick: (e) => {
            e.preventDefault();
            const toApprove = new BN(vnode.state.tokensToApprove);
            vnode.attrs.account.approveShares(toApprove)
            .then((result) => {
              $(vnode.dom).trigger('modalforceexit');
              m.redraw();
            })
            .catch((err) => notifyError(err));
          }
        }, 'Approve'),
      ]),
    ]);
  }
};

export default TokenApprovalModal;
