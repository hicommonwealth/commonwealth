import 'modals/ragequit_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import { TextInputFormField } from 'views/components/forms';
import MolochMember from 'controllers/chain/ethereum/moloch/member';
import { notifyError } from 'controllers/app/notifications';
import BN from 'bn.js';

interface IAttrs {
  account: MolochMember;
}

interface IState {
  sharesToBurn: string;
}

const RagequitModal: m.Component<IAttrs, IState> = {
  view: (vnode: m.VnodeDOM<IAttrs, IState>) => {
    const acct = vnode.attrs.account;
    return m('.RagequitModal', [
      m('.header', 'Ragequit'),
      m('.compact-modal-body', [
        m('.data-label', [ `Share holdings: ${acct?.shares?.format() ?? '--'}` ]),
        m(TextInputFormField, {
          title: 'Shares to burn',
          subtitle: 'Exchange your shares for ETH.',
          options: {
            value: vnode.state.sharesToBurn,
            oncreate: (vvnode) => {
              $(vvnode.dom).focus();
            }
          },
          callback: (val) => {
            vnode.state.sharesToBurn = val.toString();
          }
        }),
        m('button', {
          type: 'submit',
          onclick: (e) => {
            e.preventDefault();
            const toBurn = new BN(vnode.state.sharesToBurn);
            vnode.attrs.account.ragequitTx(toBurn)
              .then((result) => {
                $(vnode.dom).trigger('modalforceexit');
                m.redraw();
              })
              .catch((err) => notifyError(err));
          }
        }, 'Ragequit'),
      ]),
    ]);
  }
};

export default RagequitModal;
