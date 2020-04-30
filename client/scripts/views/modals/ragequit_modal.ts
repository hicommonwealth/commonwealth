import 'modals/ragequit_modal.scss';

import { default as m } from 'mithril';
import { default as $ } from 'jquery';
import { TextInputFormField } from 'views/components/forms';
import { MolochShares } from 'adapters/chain/ethereum/types';
import MolochMember from 'controllers/chain/ethereum/moloch/member';
import { notifyError } from 'controllers/app/notifications';
import BN from 'bn.js';

interface IAttrs {
  account: MolochMember;
  balance: MolochShares;
}

interface IState {
  sharesToBurn: string;
}

const RagequitModal: m.Component<IAttrs, IState> = {
  view: (vnode: m.VnodeDOM<IAttrs, IState>) => {
    return m('.RagequitModal', [
      m('.header', 'Ragequit'),
      m('.compact-modal-body', [
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
