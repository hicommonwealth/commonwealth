import 'modals/select_address_modal.scss';

import m from 'mithril';
import $ from 'jquery';

import { Tag } from 'construct-ui';
import app from 'state';
import { Account, RoleInfo } from 'models';
import ProfileBlock from 'views/components/widgets/profile_block';
import User from 'views/components/widgets/user';
import { isMember } from 'views/components/membership_button';
import { isSameAccount, formatAsTitleCase } from 'helpers';
import { setActiveAccount } from 'controllers/app/login';

interface ISelectAddressOptionAttrs {
  account;
  role;
}

const SelectAddressOption: m.Component<ISelectAddressOptionAttrs> = {
  view: (vnode: m.VnodeDOM<ISelectAddressOptionAttrs>) => {
    const { account, role } = vnode.attrs;

    return m('.SelectAddressOption', {
      key: `${account.chain.id}-${account.address}`,
      class: isSameAccount(app.vm.activeAccount, account) ? 'selected' : '',
      onclick: async (e) => {
        e.preventDefault();
        await setActiveAccount(account);
        $(vnode.dom).trigger('modalexit');
      },
    }, [
      m(ProfileBlock, { account }),
      role && m('.role-permission', [
        m(Tag, { label: formatAsTitleCase(role.permission), rounded: true, size: 'sm' }),
      ]),
    ]);
  }
};

const SelectAddressModal = {
  view: (vnode) => {
    const activeAddressesByRole: Array<[Account<any>, RoleInfo]> = app.login.activeAddresses.map((account) => {
      const addressId = app.login.addresses?.find((a) => {
        return a.address === account.address && a.chain === account.chain.id;
      })?.id;
      const role = app.login.roles?.find((r) => r.address_id === addressId);
      return [account, role];
    });

    return m('.SelectAddressModal', [
      m('.compact-modal-title', [
        m('h3', 'Select address'),
      ]),
      m('.compact-modal-body', [
        m('.select-existing-address', [
          m('.modal-header', 'You have multiple addresses linked to this community. Select one:'),
          activeAddressesByRole.map(([account, role]) => role && m(SelectAddressOption, { account, role })),
        ]),
        m('br'),
        m('.join-with-new-address', [
          m('.modal-header', 'Select an address to join this community:'),
          activeAddressesByRole.map(([account, role]) => !role && m(SelectAddressOption, { account, role })),
        ]),
      ]),
    ]);
  }
};

export default SelectAddressModal;
