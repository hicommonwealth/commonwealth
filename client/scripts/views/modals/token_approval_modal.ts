import 'modals/token_approval_modal.scss';

import { default as m } from 'mithril';
import { default as $ } from 'jquery';
import { TextInputFormField } from 'views/components/forms';
import { ERC20Token } from 'adapters/chain/ethereum/types';
import { notifyError } from 'controllers/app/notifications';
import BN from 'bn.js';
import EthereumAccount from 'client/scripts/controllers/chain/ethereum/account';

interface IAttrs {
  account: EthereumAccount;
  contractAddress: string;
  tokenAddress: string;
}

interface IState {
  tokensToApprove: string;
  tokensAvailable: string;
  tokensAllocated: string;
}

const TokenApprovalModal: m.Component<IAttrs, IState> = {
  oninit: (vnode) => {
    vnode.attrs.account.tokenBalance(vnode.attrs.tokenAddress).then((v) => {
      vnode.state.tokensAvailable = v.toString();
      m.redraw();
    });
    vnode.attrs.account.tokenAllowance(vnode.attrs.tokenAddress, vnode.attrs.contractAddress).then((v) => {
      vnode.state.tokensAllocated = v.toString();
      m.redraw();
    });
  },
  view: (vnode: m.VnodeDOM<IAttrs, IState>) => {
    return m('.TokenApprovalModal', [
      m('.header', 'Approve'),
      m('.compact-modal-body', [
        m(TextInputFormField, {
          title: 'Amount of token to approve',
          subtitle: 'If you want to become a DAO member, you must allow it to handle some of your tokens.',
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
        m('.token-data-label', [ `ERC20 contract address: ${vnode.attrs.tokenAddress}` ]),
        m('.token-data-label', [ `Moloch contract address: ${vnode.attrs.contractAddress}` ]),
        m('.token-data-label', [ `ERC20 Tokens available: ${vnode.state.tokensAvailable || '--'}` ]),
        m('.token-data-label', [ `ERC20 Tokens already allocated to contract: ${vnode.state.tokensAllocated || '--'}` ]),
        m('button', {
          type: 'submit',
          onclick: (e) => {
            e.preventDefault();
            const toApprove = new ERC20Token(vnode.attrs.tokenAddress, new BN(vnode.state.tokensToApprove));
            vnode.attrs.account.approveTokenTx(toApprove, vnode.attrs.contractAddress)
              .then((result) => {
                $(vnode.dom).trigger('modalforceexit');
                m.redraw();
              })
              .catch((err) => {
                console.error(err);
                notifyError(err);
              });
          }
        }, 'Approve'),
      ]),
    ]);
  }
};

export default TokenApprovalModal;
