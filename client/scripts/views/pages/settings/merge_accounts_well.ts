import 'pages/settings/settings_well.scss';

import m from 'mithril';
import app from 'state';
import $ from 'jquery';

import { DropdownFormField, RadioSelectorFormField } from 'views/components/forms';
import { notifySuccess } from 'controllers/app/notifications';
import SettingsController from 'controllers/app/settings';
import { selectNode, initChain } from 'app';
import { AddressInfo, Account } from 'models';
import { Icon, Icons, Button, Input, SelectList, ListItem } from 'construct-ui';
import SelectAddressModal from '../../modals/select_address_modal';
import { getSignatureForMessage } from '../../modals/message_signing_modal';

interface IAccountSelectListAttrs {
  accounts: Account<any>[];
  onSelect: Function;
  label: string;
}

const AccountSelectList: m.Component<IAccountSelectListAttrs, { selectedAccount: Account<any>, }> = {
  view: (vnode) => {
    return m(SelectList, {
      class: 'AccountSelector',
      filterable: false,
      checkmark: false,
      closeOnSelect: true,
      itemRender: (account: Account<any>) => {
        return m(ListItem, {
          class: 'account',
          label: [
            m(Icon, { name: Icons.USER, }),
            account.profile.name && m('span', `${account.profile.name}:`),
            m('span', account.address),
          ],
          selected: (vnode.state.selectedAccount === account),
        });
      },
      items: vnode.attrs.accounts,
      onSelect: (account: Account<any>) => {
        vnode.attrs.onSelect(account);
        vnode.state.selectedAccount = account;
        m.redraw();
      },
      trigger: m(Button, {
        align: 'left',
        class: 'tag-selection-drop-menu',
        compact: true,
        iconRight: Icons.CHEVRON_DOWN,
        label: vnode.state.selectedAccount
          ? [
            m('span.tag-name',
              vnode.state.selectedAccount.profile.name
              || vnode.state.selectedAccount.address),
          ]
          : vnode.attrs.label,
      }),
    });
  },
};

const MergeAccountsWell: m.Component<{}, {address1: Account<any>; address2: Account<any>;}> = {
  view: (vnode) => {
    const addresses = app.user.addresses;
    const accounts = app.user.activeAccounts;

    return m('.MergeAccountsWell', [
      m('h4', 'Merge Addresses'),
      m('p', 'Warning: This will merge all of your threads, comments, reactions, and roles from the first address to the second address. This is not reversible.'),
      m(AccountSelectList, {
        label: 'Select address to be merged',
        accounts,
        onSelect: (account: Account<any>) => { vnode.state.address1 = account; m.redraw(); }
      }),
      m(Icon, { name: Icons.ARROW_RIGHT }),
      m(AccountSelectList, {
        label: 'Select final address to own all content',
        accounts: accounts.filter((a) => a !== vnode.state.address1),
        onSelect: (account: Account<any>) => { vnode.state.address2 = account; m.redraw(); }
      }),
      m(Button, {
        label: 'Confirm?',
        onclick: async () => {
          if (!vnode.state.address1 || !vnode.state.address2) return;
          const signatureData = await getSignatureForMessage(vnode.state.address1, 'Merge Verification', 'NO???');
          console.dir(signatureData);
        },
      })
    ]);
  }
};

export default MergeAccountsWell;
