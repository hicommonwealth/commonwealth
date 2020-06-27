import 'components/membership_button.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, Icon, Icons, MenuItem, MenuDivider, PopoverMenu } from 'construct-ui';

import app from 'state';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import User from 'views/components/widgets/user';

const MembershipButton: m.Component<{
  chain?: string, community?: string, onMembershipChanged?, address?
}, { loading }> = {
  view: (vnode) => {
    const { chain, community, onMembershipChanged, address } = vnode.attrs; // TODO: onMembershipChanged
    if (!chain && !community) return;
    if (app.user.roles.length === 0) return;

    const createRoleWithAddress = (a, e) => {
      app.user.createRole({ address: a, chain, community })
        .then(() => {
          if (onMembershipChanged) onMembershipChanged(true);
          vnode.state.loading = false;
          m.redraw();
          // notify
          const name = chain
            ? app.config.chains.getById(chain)?.name
            : app.config.communities.getById(community)?.name;
          notifySuccess(`Joined ${name}`);
        }).catch((err: any) => {
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
      app.user.deleteRole({ address: a, chain, community })
        .then(() => {
          vnode.state.loading = false;
          m.redraw();
          // notify
          const name = chain
            ? app.config.chains.getById(chain)?.name
            : app.config.communities.getById(community)?.name;
          notifySuccess(`Left ${name}`);
        }).catch((err: any) => {
          vnode.state.loading = false;
          m.redraw();
          notifyError(err.responseJSON.error);
        });
    };

    const hasAnyExistingRole = app.user.isMember({ account: address, chain, community });

    if (!address) {
      const existingRolesAddressIDs = app.user.getAddressIdsFromRoles({ chain, community });
      const existingJoinableAddresses = app.user.getJoinableAddresses({ chain, community });

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
              label: m(User, { user: a, showRole: true }),
              onclick: hasExistingRole ? deleteRole.bind(this, a) : createRoleWithAddress.bind(this, a),
            });
          }),
          // link a new address
          existingJoinableAddresses.length > 1 && m(MenuDivider),
          m(MenuItem, {
            iconLeft: Icons.PLUS,
            label: 'New address',
            onclick: (e) => {
              app.modals.lazyCreate('link_new_address_modal');
            }
          }),
        ],
        menuAttrs: { size: 'sm' },
        inline: true,
        trigger: m(Button, {
          class: 'MembershipButton',
          disabled: vnode.state.loading,
          intent: hasAnyExistingRole ? 'primary' : 'none',
          iconLeft: Icons.CHEVRON_DOWN,
          label: hasAnyExistingRole ? 'Joined' : 'Join',
          size: 'sm',
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
      size: 'sm',
    });
  },
};

export default MembershipButton;
