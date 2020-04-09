import 'components/membership_button.scss';

import { default as m } from 'mithril';
import { default as $ } from 'jquery';
import { Button, Icon, Icons, MenuItem, MenuDivider, PopoverMenu } from 'construct-ui';

import app from 'state';
import { Account, AddressInfo } from 'models';
import { notifyError } from 'controllers/app/notifications';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import User from 'views/components/widgets/user';

export const isMember = (chain: string, community: string, address?: AddressInfo) => {
  const roles = app.login.roles.filter((role) => address ? role.address_id === address.id : true);

  return chain ? roles.map((m) => m.chain_id).indexOf(chain) !== -1 :
    community ? roles.map((m) => m.offchain_community_id).indexOf(community) !== -1 :
    false;
};

const MembershipButton: m.Component<{ chain?: string, community?: string, onMembershipChanged?, address? }, { loading }> = {
  view: (vnode) => {
    const { chain, community, onMembershipChanged, address } = vnode.attrs; // TODO: onMembershipChanged
    if (!chain && !community) return;

    const createRoleWithAddress = (address, e) => {
      $.post('/api/createRole', {
        jwt: app.login.jwt,
        address_id: address.id,
        chain,
        community,
      }).then((result) => {
        app.login.roles.push(result.result)
        onMembershipChanged && onMembershipChanged(true);
        vnode.state.loading = false;
        m.redraw();
      }).catch((e) => {
        vnode.state.loading = false;
        m.redraw();
        notifyError(e.responseJSON.error);
      });
    };

    const deleteRole = async (address, e) => {
      vnode.state.loading = true;

      const confirmed = await confirmationModalWithText('Are you sure you want to leave this community?')();
      if (!confirmed) {
        vnode.state.loading = false;
        m.redraw();
        return;
      }

      $.post('/api/deleteRole', {
        jwt: app.login.jwt,
        address_id: address.id,
        chain,
        community,
      }).then((result) => {
        const index = chain
          ? app.login.roles.findIndex((role) => role.chain_id === chain && role.address_id === address.id)
          : app.login.roles.findIndex((role) => role.offchain_community_id === community && role.address_id === address.id);
        if (index !== -1) app.login.roles.splice(index, 1);
        onMembershipChanged && onMembershipChanged(false);
        vnode.state.loading = false;
        m.redraw();
      }).catch((e) => {
        vnode.state.loading = false;
        m.redraw();
        notifyError(e.responseJSON.error);
      });
    };

    const hasAnyExistingRole = isMember(chain, community, address);

    if (!address) {
      const existingRolesAddressIDs = community
        ? app.login.roles.filter((role) => role.offchain_community_id === community).map((role) => role.address_id)
        : app.login.roles.filter((role) => role.chain_id === chain).map((role) => role.address_id)
      const existingJoinableAddresses: AddressInfo[] = community
        ? app.login.addresses
        : app.login.addresses.filter((address) => address.chain === chain);

      return m(PopoverMenu, {
        class: 'MembershipButtonPopover',
        closeOnContentClick: true,
        content: [
          // select an existing address
          existingJoinableAddresses.map((address) => {
            const hasExistingRole = existingRolesAddressIDs.indexOf(address.id) !== -1;
            // TODO: disable option to join a community if it has privacyEnabled === true
            return m(MenuItem, {
              hasAnyExistingRole: hasExistingRole,
              iconLeft: hasExistingRole ? Icons.CHECK : null,
              label: [
                m(User, { user: [address.chain, address.address] }),
                ` ${address.address.slice(0, 6)}...`,
              ],
              onclick: hasExistingRole ? deleteRole.bind(this, address) : createRoleWithAddress.bind(this, address),
            });
          }),
          // TODO: allow linking a new address
          // m(MenuItem, {
          //   iconLeft: Icons.PLUS,
          //   label: 'New address',
          //   onclick: (e) => {
          //     // TODO
          //   }
          // }),
        ],
        menuAttrs: { size: 'xs' },
        trigger: m(Button, {
          class: 'MembershipButton',
          disabled: vnode.state.loading,
          intent: hasAnyExistingRole ? 'primary' : 'none',
          iconLeft: Icons.CHEVRON_DOWN,
          label: hasAnyExistingRole ? 'Joined' : 'Join',
          size: 'xs',
        }),
      });
    }

    return m(Button, {
      class: 'MembershipButton',
      disabled: vnode.state.loading,
      onclick: hasAnyExistingRole ? deleteRole.bind(this, address) : createRoleWithAddress.bind(this, address),
      intent: hasAnyExistingRole ? 'primary' : 'none',
      iconLeft: Icons.CHECK,
      label: hasAnyExistingRole ? 'Joined' : 'Join',
      size: 'xs',
    });
  },
};

export default MembershipButton;
