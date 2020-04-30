import 'components/membership_button.scss';

import { default as m } from 'mithril';
import { default as $ } from 'jquery';
import { Button, Icon, Icons, MenuItem, MenuDivider, PopoverMenu } from 'construct-ui';

import app from 'state';
import { Account, AddressInfo } from 'models';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import User from 'views/components/widgets/user';
import LinkNewAddressModal from 'views/modals/link_new_address_modal';

export const isMember = (chain: string, community: string, address?: AddressInfo | Account<any>) => {
  if (!app.login.roles) return false;

  const addressinfo = (address instanceof Account)
    ? app.login.addresses.find((a) => address.address === a.address && address.chain.id === a.chain)
    : address;
  const roles = app.login.roles.filter((role) => addressinfo ? role.address_id === addressinfo.id : true);

  return chain ? roles.map((r) => r.chain_id).indexOf(chain) !== -1
    : community ? roles.map((r) => r.offchain_community_id).indexOf(community) !== -1
      : false;
};

const MembershipButton: m.Component<{
  chain?: string, community?: string, onMembershipChanged?, address?
}, { loading }> = {
  view: (vnode) => {
    const { chain, community, onMembershipChanged, address } = vnode.attrs; // TODO: onMembershipChanged
    if (!chain && !community) return;
    if (!app.login.roles) return;

    const createRoleWithAddress = (a, e) => {
      $.post('/api/createRole', {
        jwt: app.login.jwt,
        address_id: a.id,
        chain,
        community,
      }).then((result) => {
        // handle state updates
        app.login.roles.push(result.result);
        if (onMembershipChanged) onMembershipChanged(true);
        vnode.state.loading = false;
        m.redraw();
        // notify
        const name = chain
          ? app.config.chains.getById(chain)?.name
          : app.config.communities.getById(community)?.name;
        notifySuccess(`Joined ${name}`);
      }).catch((err) => {
        vnode.state.loading = false;
        m.redraw();
        notifyError(err.responseJSON.error);
      });
    };

    const deleteRole = async (a, e) => {
      vnode.state.loading = true;

      const confirmed = await confirmationModalWithText('Are you sure you want to leave this community?')();
      if (!confirmed) {
        vnode.state.loading = false;
        m.redraw();
        return;
      }

      $.post('/api/deleteRole', {
        jwt: app.login.jwt,
        address_id: a.id,
        chain,
        community,
      }).then((result) => {
        // handle state updates
        const index = chain
          ? app.login.roles.findIndex((r) => r.chain_id === chain && r.address_id === a.id)
          : app.login.roles.findIndex((r) => r.offchain_community_id === community && r.address_id === a.id);
        if (index !== -1) app.login.roles.splice(index, 1);
        if (onMembershipChanged) onMembershipChanged(false);
        vnode.state.loading = false;
        m.redraw();
        // notify
        const name = chain
          ? app.config.chains.getById(chain)?.name
          : app.config.communities.getById(community)?.name;
        notifySuccess(`Left ${name}`);
      }).catch((err) => {
        vnode.state.loading = false;
        m.redraw();
        notifyError(err.responseJSON.error);
      });
    };

    const hasAnyExistingRole = isMember(chain, community, address);

    if (!address) {
      const existingRolesAddressIDs = community
        ? app.login.roles.filter((role) => role.offchain_community_id === community).map((role) => role.address_id)
        : app.login.roles.filter((role) => role.chain_id === chain).map((role) => role.address_id);
      const existingJoinableAddresses: AddressInfo[] = community
        ? app.login.addresses
        : app.login.addresses.filter((a) => a.chain === chain);

      return m(PopoverMenu, {
        class: 'MembershipButtonPopover',
        closeOnContentClick: true,
        content: [
          // select an existing address
          existingJoinableAddresses.map((a) => {
            const hasExistingRole = existingRolesAddressIDs.indexOf(a.id) !== -1;
            const cannotJoinPrivateCommunity = community && app.config.communities.getById(community)?.privacyEnabled
              && !hasExistingRole;
            return m(MenuItem, {
              disabled: cannotJoinPrivateCommunity,
              hasAnyExistingRole: hasExistingRole,
              iconLeft: hasExistingRole ? Icons.CHECK : null,
              label: [
                m(User, { user: [a.address, a.chain] }),
                ` ${a.address.slice(0, 6)}...`,
              ],
              onclick: hasExistingRole ? deleteRole.bind(this, a) : createRoleWithAddress.bind(this, a),
            });
          }),
          // link a new address
          existingJoinableAddresses.length > 1 && m(MenuDivider),
          m(MenuItem, {
            iconLeft: Icons.PLUS,
            label: 'New address',
            onclick: (e) => {
              app.modals.create({ modal: LinkNewAddressModal });
            }
          }),
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
