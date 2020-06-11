import 'components/settings/accounts_well.scss';

import m from 'mithril';
import _ from 'lodash';
import app from 'state';
import { Button } from 'construct-ui';

import { formatCoin, Coin } from 'adapters/currency';
import { orderAccountsByAddress, link } from 'helpers';
import { unlinkLogin } from 'controllers/app/login';
import { SubstrateAccount } from 'controllers/chain/substrate/account';

import { AddressInfo, ChainClass } from 'models';
import User from 'views/components/widgets/user';
import LinkNewAddressModal from 'views/modals/link_new_address_modal';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import RagequitModal from 'views/modals/ragequit_modal';
import MolochMember from 'controllers/chain/ethereum/moloch/member';
import UpdateDelegateModal from 'views/modals/update_delegate_modal';
import TokenApprovalModal from 'views/modals/token_approval_modal';

const AccountRow : m.Component<{ account: AddressInfo, onclick?: (e: Event) => any }, { removing }> = {
  view: (vnode): m.Vnode => {
    const { account } = vnode.attrs;
    const isActiveAccount = app.vm.activeAccount
      && app.vm.activeAccount.chain.id === account.chain
      && app.vm.activeAccount.address === account.address;

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
        m('.address', `${account.address} (${account.chain})`),
        (account instanceof MolochMember && account.isMember && account.delegateKey) ? m('.moloch-delegatekey', [
          'Delegate: ',
          account.isMember
            ? link('a', `/${account.chain.id}/account/${account.delegateKey}`, account.delegateKey)
            : 'N/A',
        ]) : [],
      ]),
      m('.action-col', [
        m(Button, {
          intent: 'negative',
          size: 'sm',
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
          disabled: vnode.state.removing,
          label: vnode.state.removing ? 'Removing...' : 'Remove'
        }),
      ]),
    ]);
  },
};

const AccountsWell: m.Component<{}> = {
  view: () => {
    const addressGroups = Object.entries(_.groupBy(app.login.addresses, (account) => account.chain));

    return m('.AccountsWell', [
      m('h4', 'Linked Addresses'),
      m('.address-listing-explanation', 'Log into your account using any of these addresses'),
      addressGroups.map(([chain_id, addresses]) => m('.address-group', [
        m('h4', app.config.chains.getById(chain_id).name),
        addresses.sort(orderAccountsByAddress).map((account) => m(AccountRow, { account })),
      ])),
      app.login.addresses.length === 0
        && m('.no-accounts', 'No addresses'),
      m(Button, {
        intent: 'primary',
        class: 'add-account',
        onclick: () => app.modals.create({ modal: LinkNewAddressModal }),
        label: `Link new ${(app.chain && app.chain.chain && app.chain.chain.denom) || ''} address`
      }),
    ]);
  },
};

export default AccountsWell;
