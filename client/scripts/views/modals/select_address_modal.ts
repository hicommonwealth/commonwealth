import 'modals/select_address_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import { Tag, Button } from 'construct-ui';

import app from 'state';
import { Account, RoleInfo } from 'models';
import User, { UserBlock } from 'views/components/widgets/user';
import { isSameAccount, formatAsTitleCase } from 'helpers';
import { setActiveAccount } from 'controllers/app/login';

const SelectAddressModal: m.Component<{}, { selectedIndex }> = {
  view: (vnode) => {
    const activeAccountsByRole: Array<[Account<any>, RoleInfo]> = app.user.getActiveAccountsByRole();

    return m('.SelectAddressModal', [
      m('.compact-modal-title', [
        m('h3', 'Connect another address'),
      ]),
      m('.compact-modal-body', [
        m('.select-address-options', [
          activeAccountsByRole.map(([account, role]) => role && m('.select-address-option.existing', [
            m(UserBlock, { user: account }),
          ])),
          activeAccountsByRole.map(([account, role], index) => !role && m('.select-address-option', {
            onclick: async (e) => {
              e.preventDefault();
              vnode.state.selectedIndex = index;
            },
          }, [
            m(UserBlock, { user: account, selected: vnode.state.selectedIndex === index }),
            role && m('.role-permission', [
              m(Tag, { label: formatAsTitleCase(role.permission), rounded: true, size: 'sm' }),
              role.is_user_default && m(Tag, { label: 'Last used', rounded: true, size: 'sm' }),
            ]),
          ])),
        ]),
        m('br'),
        m(Button, {
          label: vnode.state.selectedIndex === undefined ? 'Select an address' : 'Join community with address',
          intent: 'primary',
          compact: true,
          fluid: true,
          disabled: vnode.state.selectedIndex === undefined,
          onclick: (e) => {
          }
        }),
      ]),
    ]);
  }
};

export default SelectAddressModal;
