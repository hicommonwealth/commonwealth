import 'components/membership_button.scss';

import { default as m } from 'mithril';
import { default as $ } from 'jquery';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { Button, Icon, Icons } from 'construct-ui';

import app from 'state';

export const isMember = (chain, community) => {
  return chain ? app.login.roles.map((m) => m.chain_id).indexOf(chain) !== -1 :
    community ? app.login.roles.map((m) => m.offchain_community_id).indexOf(community) !== -1 :
    false;
};

const MembershipButton: m.Component<{ chain?: string, community?: string, onMembershipChanged? }, { loading }> = {
  view: (vnode) => {
    const { chain, community, onMembershipChanged } = vnode.attrs;
    if (!chain && !community) return;

    const createMembership = (e) => {
      e.preventDefault();
      e.stopPropagation();
      $.post('/api/createMembership', {
        jwt: app.login.jwt,
        chain,
        community,
      }).then((result) => {
        app.login.memberships.push(result.result)
        onMembershipChanged && onMembershipChanged(true);
        vnode.state.loading = false;
        m.redraw();
      }).catch((e) => {
        vnode.state.loading = false;
        m.redraw();
        console.error(e);
      });
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

      $.post('/api/deleteMembership', {
        jwt: app.login.jwt,
        chain,
        community,
      }).then((result) => {
        if (chain) {
          const chainIndex = app.login.memberships.map((m) => m.chain).indexOf(chain)
          app.login.memberships.splice(chainIndex, 1);
        } else if (community) {
          const communityIndex = app.login.memberships.map((m) => m.community).indexOf(community)
          app.login.memberships.splice(communityIndex, 1);
        }
        onMembershipChanged && onMembershipChanged(false);
        vnode.state.loading = false;
        m.redraw();
      }).catch((e) => {
        vnode.state.loading = false;
        m.redraw();
        console.error(e);
      });
    };

    return m(Button, {
      class: ('MembershipButton ' +
              (isMember(chain, community) ? 'formular-button-primary is-member' : '') +
              (vnode.state.loading ? ' disabled' : '')),
      onclick: isMember(chain, community) ? deleteMembership : createMembership,
      intent: isMember(chain, community) ? 'primary' : 'none',
      iconLeft: Icons.CHECK,
      label: isMember(chain, community) ? 'Joined' : 'Join',
      size: 'xs',
    });
  },
};

export default MembershipButton;
