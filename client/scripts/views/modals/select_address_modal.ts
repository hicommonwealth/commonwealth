import 'modals/select_address_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import { Tag, Button, Icon, Icons } from 'construct-ui';

import app from 'state';
import { Account, RoleInfo } from 'models';
import { UserBlock } from 'views/components/widgets/user';
import { formatAsTitleCase, formatAddressShort } from 'helpers';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { confirmationModalWithText } from 'views/modals/confirm_modal';

const SelectAddressModal: m.Component<{}, { selectedIndex: number, loading: boolean }> = {
  view: (vnode) => {
    const activeAccountsByRole: Array<[Account<any>, RoleInfo]> = app.user.getActiveAccountsByRole();

    const createRole = (e) => {
      vnode.state.loading = true;

      const [account, role] = activeAccountsByRole[vnode.state.selectedIndex];
      const addressInfo = app.user.addresses
        .find((a) => a.address === account.address && a.chain === account.chain.id);
      const activeEntityInfo = app.community ? app.community.meta : app.chain.meta.chain;
      app.user.createRole({
        address: addressInfo,
        chain: app.activeChainId(),
        community: app.activeCommunityId(),
      }).then(() => {
        vnode.state.loading = false;
        m.redraw();
        vnode.state.selectedIndex = null;
        // select the address, and close the form
        notifySuccess(`Switched to ${formatAddressShort(addressInfo.address)}`);
        app.user.setActiveAccount(account);
        $(e.target).trigger('modalexit');
      }).catch((err: any) => {
        vnode.state.loading = false;
        m.redraw();
        notifyError(err.responseJSON.error);
      });
    };

    const deleteRole = async (index, e) => {
      vnode.state.loading = true;
      const [account, role] = activeAccountsByRole[index];
      const addressInfo = app.user.addresses
        .find((a) => a.address === account.address && a.chain === account.chain.id);
      const activeEntityInfo = app.community ? app.community.meta : app.chain.meta.chain;

      // confirm
      const confirmed = await confirmationModalWithText(
        `Are you sure you want to remove ${formatAddressShort(addressInfo.address)} from this community?`
      )();
      if (!confirmed) {
        vnode.state.loading = false;
        m.redraw();
        return;
      }

      app.user.deleteRole({
        address: addressInfo,
        chain: app.activeChainId(),
        community: app.activeCommunityId(),
      }).then(() => {
        vnode.state.loading = false;
        m.redraw();
        vnode.state.selectedIndex = null; // TODO: the newly added address instead
        // TODO: select the address
      }).catch((err: any) => {
        vnode.state.loading = false;
        m.redraw();
        notifyError(err.responseJSON.error);
      });
    };

    return m('.SelectAddressModal', [
      m('.compact-modal-title', [
        m('h3', 'Manage Addresses'),
      ]),
      m('.compact-modal-body', [
        m('.select-address-options', [
          activeAccountsByRole.map(([account, role], index) => role && m('.select-address-option.existing', [
            m(UserBlock, { user: account }),
            m('.role-remove', {
              onclick: deleteRole.bind(this, index)
            }, [
              m(Icon, { name: Icons.X }),
            ]),
          ])),
          activeAccountsByRole.map(([account, role], index) => !role && m('.select-address-option', {
            class: vnode.state.selectedIndex === index ? 'selected' : '',
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
        // m('.select-address-explanation', [
        //   'You can link multiple addresses in one community, e.g. ',
        //   'separate voting and staking addresses.',
        // ]),
        m(Button, {
          label: vnode.state.selectedIndex === undefined ? 'Select an address' : 'Join community with address',
          intent: 'primary',
          compact: true,
          fluid: true,
          disabled: vnode.state.selectedIndex === undefined || vnode.state.loading,
          onclick: createRole.bind(this),
        }),
        m(Button, {
          label: 'Connect a new address',
          intent: 'none',
          compact: true,
          fluid: true,
          disabled: vnode.state.loading,
          onclick: (e) => {
            app.modals.lazyCreate('link_new_address_modal');
          },
        }),
      ]),
    ]);
  }
};

export default SelectAddressModal;
