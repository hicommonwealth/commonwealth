/* eslint-disable no-unused-expressions */
import 'pages/discussions.scss';

import _ from 'lodash';
import m from 'mithril';
import $ from 'jquery';

import app from 'state';
import { RolePermission } from 'models';
import User from 'views/components/widgets/user';
import CreateInviteModal from '../../modals/create_invite_modal';
import UpgradeMemberModal from '../../modals/upgrade_member_modal';
import ManageCommunityModal from '../../modals/manage_community_modal';

export const isCommunityAdmin = () => {
  return (app.login.roles[app.activeId()]?.permission === RolePermission.admin);
};

export const sortAdminsAndModsFirst = (a, b) => {
  if (a.permission === b.permission) return a.Address.address.localeCompare(b.Address.address);
  if (a.permission === RolePermission.admin) return -1;
  if (b.permission === RolePermission.admin) return 1;
  if (a.permission === RolePermission.moderator) return -1;
  if (b.permission === RolePermission.moderator) return 1;
  return a.Address.address.localeCompare(b.Address.address);
};

const isAdminOrModOfChain = (vnode, account) => {
  if (!account) return false;
  return vnode.state.roleData.findIndex((role) => (
    role.Address.address === app.vm.activeAccount.address
    && role.Address.chain === app.vm.activeAccount.chain.id
    && role.permission !== RolePermission.member)) !== -1;
};

const isAdminOrMod = (vnode, account) => {
  if (!account) return false;
  return vnode.state.roleData.findIndex((role) => (
    role.Address.address === account.address
    && role.permission !== RolePermission.member)) !== -1;
};

const isAdmin = (vnode, account) => {
  if (!account) return false;
  return vnode.state.roleData.findIndex((role) => (
    role.Address.address === account.address
    && role.permission === RolePermission.admin)) !== -1;
};

const InviteButton = (vnode, account, isCommunity) => {
  if (!isCommunity) return;
  // invite button, if invites are enabled, OR if the current account is a mod or admin
  return app.login
    && app.community
    && app.vm.activeAccount
    && (app.community.meta.invitesEnabled || isAdminOrModOfChain(vnode, account))
    && m('button', {
      onclick: (e) => {
        e.preventDefault();
        app.modals.create({
          modal: CreateInviteModal,
          data: {
            communityInfo: app.community.meta,
          },
        });
      },
    }, 'Invite members');
};

const UpgradeMemberButton = (vnode, account) => {
  return app.vm.activeAccount
    && isAdminOrMod(vnode, account)
    && m('button', {
      onclick: (e) => {
        e.preventDefault();
        app.modals.create({
          modal: UpgradeMemberModal,
        });
      },
    }, 'Upgrade member');
};

const ManageCommunityButton = (vnode, account) => {
  return isAdmin(vnode, account)
    && m('button', {
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
    }, 'Manage community');
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
    const chainOrCommObj = (app.chain) ? { chain: app.activeChainId() } : { community: app.activeCommunityId() };
    const isCommunity = (!app.chain);

    const loadCommunity = async () => {
      try {
        const bulkMembers = await $.get(`${app.serverUrl()}/bulkMembers`, chainOrCommObj);
        if (bulkMembers.status !== 'Success') throw new Error(`Could not fetch members`);
        vnode.state.roleData = bulkMembers.result;

        if (isAdmin(vnode, app.vm.activeAccount)) {
          const webhooks = await $.get(`${app.serverUrl()}/getWebhooks`,
                                       { ...chainOrCommObj, auth: true, jwt: app.login.jwt });
          if (webhooks.status !== 'Success') throw new Error(`Could not fetch community webhooks`);
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
      && app.vm.activeAccount
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
        InviteButton(vnode, app.vm.activeAccount, isCommunity),
        UpgradeMemberButton(vnode, app.vm.activeAccount),
        ManageCommunityButton(vnode, app.vm.activeAccount),
      ])
    ]);
  },
};

export default ChainOrCommunityRoles;
