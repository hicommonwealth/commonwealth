/* eslint-disable no-unused-expressions */
import 'pages/discussions/index.scss';

import _ from 'lodash';
import m from 'mithril';
import $ from 'jquery';
import { Button } from 'construct-ui';

import app from 'state';
import { RolePermission } from 'models';
import User from 'views/components/widgets/user';
import CreateInviteModal from '../../modals/create_invite_modal';
import UpgradeMemberModal from '../../modals/upgrade_member_modal';
import ManageCommunityModal from '../../modals/manage_community_modal';

export const sortAdminsAndModsFirst = (a, b) => {
  if (a.permission === b.permission) return a.Address.address.localeCompare(b.Address.address);
  if (a.permission === RolePermission.admin) return -1;
  if (b.permission === RolePermission.admin) return 1;
  if (a.permission === RolePermission.moderator) return -1;
  if (b.permission === RolePermission.moderator) return 1;
  return a.Address.address.localeCompare(b.Address.address);
};

const InviteButton = (vnode, account, isCommunity) => {
  if (!isCommunity) return;
  // invite button, if invites are enabled, OR if the current account is a mod or admin
  return app.user
    && app.community
    && app.user.activeAccount
    // TODO: Ensure the right role check is used
    && (app.community.meta.invitesEnabled || app.user.isAdminOrModOfEntity({ community: app.activeCommunityId() }))
    && m(Button, {
      onclick: (e) => {
        e.preventDefault();
        app.modals.create({
          modal: CreateInviteModal,
          data: {
            communityInfo: app.community.meta,
          },
        });
      },
      label: 'Invite members',
    });
};

const UpgradeMemberButton = (vnode, account) => {
  return app.user.activeAccount
    && app.user.isAdminOrMod({ account })
    && m(Button, {
      onclick: (e) => {
        e.preventDefault();
        app.modals.create({
          modal: UpgradeMemberModal,
        });
      },
      label: 'Upgrade member'
    });
};

const ManageCommunityButton = (vnode, account) => {
  return app.user.isAdmin({ account })
    && m(Button, {
      onclick: (e) => {
        e.preventDefault();
        app.modals.create({
          modal: ManageCommunityModal,
          data: {
            webhooks: vnode.state.webhooks,
            communityInfo: (app.community) ? app.community.meta : null,
          }
        });
      },
      label: 'Manage community'
    });
};

interface IChainOrCommunityRolesState {
  loadingStarted: boolean;
  loadingFinished: boolean;
  roleData;
  webhooks;
}
// Admins, mods, and members module.
const ChainOrCommunityRoles: m.Component<{}, IChainOrCommunityRolesState> = {
  oncreate: (vnode) => {
    vnode.state.webhooks = [];
  },
  view: (vnode: m.VnodeDOM<{}, IChainOrCommunityRolesState>) => {
    if (!app.activeId()) return;
    const chainOrCommObj = (app.chain) ? { chain: app.activeChainId() } : { community: app.activeCommunityId() };
    const isCommunity = (!app.chain);

    const loadCommunity = async () => {
      try {
        // TODO: Change to GET /members
        const bulkMembers = await $.get(`${app.serverUrl()}/bulkMembers`, chainOrCommObj);
        if (bulkMembers.status !== 'Success') throw new Error('Could not fetch members');
        vnode.state.roleData = bulkMembers.result;

        if (app.user.isAdminOfEntity({
          chain: app.activeChainId(),
          community: app.activeCommunityId()
        })) {
          // TODO: Change to GET /webhooks
          const webhooks = await $.get(`${app.serverUrl()}/getWebhooks`,
            { ...chainOrCommObj, auth: true, jwt: app.user.jwt });
          if (webhooks.status !== 'Success') throw new Error('Could not fetch community webhooks');
          vnode.state.webhooks = webhooks.result;
        }
        vnode.state.loadingFinished = true;
        m.redraw();
      } catch (err) {
        vnode.state.roleData = [];
        vnode.state.loadingFinished = true;
        m.redraw();
        console.error(err);
      }
    };

    if (!vnode.state.loadingStarted) {
      vnode.state.loadingStarted = true;
      loadCommunity();
    }

    return m('.OffchainCommunityRoles', [
      vnode.state.roleData?.length > 0 && m('h4.sidebar-header', 'Members'),
      vnode.state.loadingFinished
      && app.user.activeAccount
      && m('.members', [
        // list of mods/admins
        !vnode.state.roleData && m('.no-mods', 'None'),
        vnode.state.roleData.sort(sortAdminsAndModsFirst).map((role) => {
          return m('.member-item', [
            m(User, {
              user: [role.Address.address, role.Address.chain],
              linkify: true,
              tooltip: true,
            }),
            role.permission !== RolePermission.member && m('span.role-level', ` (${role.permission})`),
          ]);
        }),
        InviteButton(vnode, app.user.activeAccount, isCommunity),
        UpgradeMemberButton(vnode, app.user.activeAccount),
        ManageCommunityButton(vnode, app.user.activeAccount),
      ])
    ]);
  },
};

export default ChainOrCommunityRoles;
