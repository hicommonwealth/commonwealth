import 'components/membership_button.scss';

import { default as m } from 'mithril';
import { default as $ } from 'jquery';
import { Button, Icon, Icons } from 'construct-ui';

import app from 'state';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { Account, AddressInfo } from 'models';

export const isMember = (chain: string, community: string, address?: AddressInfo) => {
  const roles = app.login.roles.filter((role) => address ? role.address_id === address.id : true);

  return chain ? roles.map((m) => m.chain_id).indexOf(chain) !== -1 :
    community ? roles.map((m) => m.offchain_community_id).indexOf(community) !== -1 :
    false;
};

const MembershipButton: m.Component<{ chain?: string, community?: string, onMembershipChanged?, address? }, { loading }> = {
  view: (vnode) => {
    const { chain, community, onMembershipChanged, address } = vnode.attrs;
    if (!chain && !community) return;

    const createMembership = (e) => {
      e.preventDefault();
      e.stopPropagation();
      // $.post('/api/createMembership', {
      //   jwt: app.login.jwt,
      //   chain,
      //   community,
      // }).then((result) => {
      //   app.login.memberships.push(result.result)
      //   onMembershipChanged && onMembershipChanged(true);
      //   vnode.state.loading = false;
      //   m.redraw();
      // }).catch((e) => {
      //   vnode.state.loading = false;
      //   m.redraw();
      //   console.error(e);
      // });
    };
    const deleteMembership = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      vnode.state.loading = true;

      const confirmed = await confirmationModalWithText('Are you sure you want to leave this community?')();
      if (!confirmed) {
        vnode.state.loading = false;
        m.redraw();
        return;
      }

      // $.post('/api/deleteMembership', {
      //   jwt: app.login.jwt,
      //   chain,
      //   community,
      // }).then((result) => {
      //   if (chain) {
      //     const chainIndex = app.login.memberships.map((m) => m.chain).indexOf(chain)
      //     app.login.memberships.splice(chainIndex, 1);
      //   } else if (community) {
      //     const communityIndex = app.login.memberships.map((m) => m.community).indexOf(community)
      //     app.login.memberships.splice(communityIndex, 1);
      //   }
      //   onMembershipChanged && onMembershipChanged(false);
      //   vnode.state.loading = false;
      //   m.redraw();
      // }).catch((e) => {
      //   vnode.state.loading = false;
      //   m.redraw();
      //   console.error(e);
      // });
    };

    const active = isMember(chain, community, address);

    return m(Button, {
      class: `MembershipButton ${active ? ' is-member' : ''} ${vnode.state.loading ? ' disabled' : ''}`,
      onclick: active ? deleteMembership : createMembership,
      intent: active ? 'primary' : 'none',
      iconLeft: Icons.CHECK,
      label: active ? 'Joined' : 'Join',
      size: 'xs',
    });
  },
};

export default MembershipButton;
