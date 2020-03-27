import 'components/settings/accounts_well.scss';

import m from 'mithril';
import app from 'state';

import { formatCoin, Coin } from 'adapters/currency';
import { orderAccountsByAddress, link } from 'helpers';
import { selectLogin, unlinkLogin } from 'controllers/app/login';
import { SubstrateAccount } from 'controllers/chain/substrate/account';

import { AddressInfo, ChainClass } from 'models';
import User from 'views/components/widgets/user';
import LinkNewAddressModal from 'views/modals/link_new_address_modal';
import { confirmationModalWithText } from 'views/modals/confirm_modal';

import RagequitModal from 'views/modals/ragequit_modal';
import MolochMember from 'controllers/chain/ethereum/moloch/member';
import UpdateDelegateModal from 'views/modals/update_delegate_modal';
import TokenApprovalModal from 'views/modals/token_approval_modal';

import { blake2AsHex } from '@polkadot/util-crypto';

interface IAttrs {
  account: AddressInfo;
  hasAction?: boolean;
  isEVM?: boolean;
  onclick?: (e: Event) => any;
}

interface IState {
  removing: boolean;
}

const AccountRow : m.Component<IAttrs, IState> = {
  view: (vnode: m.VnodeDOM<IAttrs, IState>): m.Vnode => {
    const { account } = vnode.attrs;
    const isActiveAccount = app.vm.activeAccount
      && app.vm.activeAccount.chain.id === account.chain
      && app.vm.activeAccount.address === account.address;
    const address = (!vnode.attrs.isEVM)
      ? account.address
      : `0x${blake2AsHex(account.address, 256).substring(26)}`;
    return m('.AccountRow', {
      key: `${account.chain}#${account.address}`,
      onclick: vnode.attrs.onclick,
      class: isActiveAccount ? 'selected' : '',
    }, [
      m('.avatar-col', [
        m(User, {
          user: [account.address, account.chain],
          avatarOnly: true,
          avatarSize: 32,
          linkify: true,
          tooltip: true
        }),
      ]),
      m('.info-col', [
        m('.username', [
          m(User, {
            user: [account.address, account.chain],
            hideAvatar: true,
            linkify: true,
            tooltip: true,
          }),
        ]),
        // checking for balance to guarantee that delegate key has loaded
        m('.address', `${address} ${(account.chain['id']) ? account.chain['id'] : ''}`),
        (account instanceof MolochMember && account.isMember && account.delegateKey) ? m('.moloch-delegatekey', [
          'Delegate: ',
          account.isMember
            ? link('a', `/${account.chain.id}/account/${account.delegateKey}`, account.delegateKey)
            : 'N/A',
        ]) : [],
      ]),
      vnode.attrs.hasAction && m('.action-col', [
        // TODO: re-enable this as 'go to chain and account'
        // (app.chain || app.community) && m('button.formular-button-primary', {
        //   class: isActiveAccount ? 'disabled' : '',
        //   onclick: () => selectLogin(account),
        // }, 'Switch account'),
        m('button.formular-button-negative', {
          class: vnode.state.removing ? ' disabled' : '',
          onclick: async () => {
            const confirmed = await confirmationModalWithText('Are you sure you want to remove this account?')();
            if (confirmed) {
              vnode.state.removing = true;
              unlinkLogin(account).then(() => {
                vnode.state.removing = false;
                m.redraw();
              });
            }
          },
        }, vnode.state.removing ? 'Removing...' : 'Remove'),
      ]),
    ]);
  },
};

const AccountsWell: m.Component<{ addresses, hasAction, isEVM }> = {
  view: (vnode) => {
    return m('.AccountsWell', [
      m('h4', 'Linked Addresses'),
      m('.address-listing-explanation', 'Log into your account using any of these addresses'),
      vnode.attrs.addresses
        .sort(orderAccountsByAddress)
        .map((account) => m(AccountRow, {
          account,
          hasAction: vnode.attrs.hasAction,
          isEVM: vnode.attrs.isEVM,
        })),
      vnode.attrs.addresses.length === 0
        && m('.no-accounts', 'No addresses'),
      vnode.attrs.hasAction && m('button.formular-button-primary.add-account', {
        onclick: () => app.modals.create({ modal: LinkNewAddressModal }),
      }, `Link new ${(app.chain && app.chain.chain && app.chain.chain.denom) || ''} address`),
    ]);
  },
};

export default AccountsWell;
