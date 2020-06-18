import 'modals/select_address_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import { Tag, Button } from 'construct-ui';

import app from 'state';
import { Account, RoleInfo } from 'models';
import User, { UserBlock } from 'views/components/widgets/user';
import { isSameAccount, formatAsTitleCase, getRoleInCommunity } from 'helpers';
import { setActiveAccount } from 'controllers/app/login';

const SelectAddressModal: m.Component<{}, { selectedIndex }> = {
  view: (vnode) => {
    const activeAddressesByRole: Array<[Account<any>, RoleInfo]> = app.login.activeAddresses.map((account) => {
      const role = getRoleInCommunity(account, app.activeChainId(), app.activeCommunityId());
      return [account, role];
    });

    return m('.SelectAddressModal', [
      m('.compact-modal-title', [
        m('h3', 'Add address'),
      ]),
      m('.compact-modal-body', [
        // m('.select-existing-address', [
        //   m('.modal-header', 'You have multiple addresses linked to this community. Select one:'),
        //   activeAddressesByRole.map(([account, role]) => role && m(SelectAddressOption, { account, role })),
        // ]),
        // m('br'),
        activeAddressesByRole.map(([account, role], index) => !role && m('.SelectAddressOption', {
          class: vnode.state.selectedIndex === index ? 'selected' : '',
          onclick: async (e) => {
            e.preventDefault();
            vnode.state.selectedIndex = index;
          },
        }, [
          m(UserBlock, { user: account }),
          role && m('.role-permission', [
            m(Tag, { label: formatAsTitleCase(role.permission), rounded: true, size: 'sm' }),
            role.is_user_default && m(Tag, { label: 'Last used', rounded: true, size: 'sm' }),
          ]),
        ])),
        m('br'),
        m(Button, {
          label: 'Join community',
          intent: 'primary',
          disabled: vnode.state.selectedIndex === undefined,
          onclick: (e) => {
          }
        }),
      ]),
    ]);
  }
};

export default SelectAddressModal;
