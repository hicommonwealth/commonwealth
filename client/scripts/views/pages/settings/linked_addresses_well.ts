import 'pages/settings/linked_addresses_well.scss';

import m from 'mithril';
import _ from 'lodash';
import app from 'state';
import { Button } from 'construct-ui';

import { orderAccountsByAddress, link } from 'helpers';
import { unlinkLogin } from 'controllers/app/login';

import { AddressInfo } from 'models';
import User from 'views/components/widgets/user';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import MolochMember from 'controllers/chain/ethereum/moloch/member';

const AccountRow: m.Component<{ account: AddressInfo, onclick?: (e: Event) => any }, { removing }> = {
  view: (vnode): m.Vnode => {
    const { account } = vnode.attrs;
    const isActiveAccount = app.user.activeAccount
      && app.user.activeAccount.chain.id === account.chain
      && app.user.activeAccount.address === account.address;

    return m('.AccountRow', {
      key: `${account.chain}#${account.address}`,
      onclick: vnode.attrs.onclick,
      class: isActiveAccount ? 'selected' : '',
    }, [
      m('.avatar-col', [
        m(User, {
          user: account,
          avatarOnly: true,
          avatarSize: 32,
          linkify: true,
          popover: true
        }),
      ]),
      m('.info-col', [
        m('.username', [
          m(User, {
            user: account,
            hideAvatar: true,
            linkify: true,
            popover: true,
          }),
        ]),
        // checking for balance to guarantee that delegate key has loaded
        m('.address', `${account.address} - ${app.config.chains.getById(account.chain)?.name}`),
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
          onclick: async () => {
            const confirmed = await confirmationModalWithText('Are you sure you want to remove this account?')();
            if (confirmed) {
              vnode.state.removing = true;
              if (app.user.activeAccount?.address === account.address
                  && app.user.activeAccount?.chain.id === account.chain) {
                app.user.ephemerallySetActiveAccount(null);
              }
              unlinkLogin(account).then(() => {
                vnode.state.removing = false;
                m.redraw();
              });
            }
          },
          disabled: vnode.state.removing,
          loading: vnode.state.removing,
          label: 'Remove',
        }),
      ]),
    ]);
  },
};

const LinkedAddressesWell: m.Component<{}> = {
  view: () => {
    const addressGroups = Object.entries(_.groupBy(app.user.addresses, (account) => account.chain));

    return m('.LinkedAddressesWell', [
      addressGroups.map(([chain_id, addresses]) => m('.address-group', [
        addresses.sort(orderAccountsByAddress).map((account) => m(AccountRow, { account })),
      ])),
      app.user.addresses.length === 0
        && m('.no-accounts', 'No addresses'),
    ]);
  },
};

export default LinkedAddressesWell;
