/* eslint-disable @typescript-eslint/ban-types */
import 'pages/manage_community.scss';

import m from 'mithril';
import $ from 'jquery';

import app from 'state';
import { ChainInfo, RoleInfo, RolePermission, Webhook } from 'models';
import ChainMetadataManagementTable from './chain_metadata_management_table';
import AdminPanelTabs from './admin_panel_tabs';
import Sublayout from '../../sublayout';
import { CWButton } from '../../components/component_kit/cw_button';
import { notifyError, notifySuccess } from 'controllers/app/notifications';

const sortAdminsAndModsFirst = (a, b) => {
  if (a.permission === b.permission)
    return a.Address.address.localeCompare(b.Address.address);
  if (a.permission === RolePermission.admin) return -1;
  if (b.permission === RolePermission.admin) return 1;
  if (a.permission === RolePermission.moderator) return -1;
  if (b.permission === RolePermission.moderator) return 1;
  return a.Address.address.localeCompare(b.Address.address);
};

const deleteChainButton = (chain: ChainInfo) => {
  return m(CWButton, {
    label: 'DELETE CHAIN',
    onclick: (e) => {
      $.post(`${app.serverUrl()}/deleteChain`, {
        id: chain.id,
        auth: true,
        jwt: app.user.jwt,
      }).then((result) => {
        if (result.status !== 'Success') return;
        app.config.chains.remove(chain);
        notifySuccess('Deleted chain!');
        m.route.set('/');
        // redirect to /
      }, (err) => {
        notifyError('Failed to delete chain!');
      });
    }
  });
}

const ManageCommunityPage: m.Component<
  {},
  {
    roleData: RoleInfo[];
    webhooks: Webhook[];
    loadingFinished: boolean;
    loadingStarted: boolean;
  }
> = {
  view: (vnode) => {
    if (!app.activeChainId()) {
      return;
    }
    const chainOrCommObj = { chain: app.activeChainId() };
    const loadRoles = async () => {
      try {
        // TODO: Change to GET /members
        const bulkMembers = await $.get(
          `${app.serverUrl()}/bulkMembers`,
          chainOrCommObj
        );
        if (bulkMembers.status !== 'Success')
          throw new Error('Could not fetch members');
        // TODO: Change to GET /webhooks
        const webhooks = await $.get(`${app.serverUrl()}/getWebhooks`, {
          ...chainOrCommObj,
          auth: true,
          jwt: app.user.jwt,
        });
        if (webhooks.status !== 'Success')
          throw new Error('Could not fetch community webhooks');
        vnode.state.webhooks = webhooks.result;
        vnode.state.roleData = bulkMembers.result;
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
      loadRoles();
    }

    const admins = [];
    const mods = [];
    if (vnode.state.roleData?.length > 0) {
      vnode.state.roleData.sort(sortAdminsAndModsFirst).forEach((role) => {
        if (role.permission === RolePermission.admin) admins.push(role);
        else if (role.permission === RolePermission.moderator) mods.push(role);
      });
    }

    const onRoleUpdate = (oldRole, newRole) => {
      // newRole doesn't have the Address property that oldRole has,
      // Add the missing Address property to the newRole, then splice it into the array.
      newRole.Address = oldRole.Address;
      const predicate = (r) => {
        return r.id === oldRole.id;
      };
      vnode.state.roleData.splice(
        vnode.state.roleData.indexOf(oldRole),
        1,
        newRole
      );
      app.user.addRole(newRole);
      app.user.removeRole(predicate);
      const { adminsAndMods } = app.chain.meta.chain;
      if (
        oldRole.permission === 'admin' ||
        oldRole.permission === 'moderator'
      ) {
        const idx = adminsAndMods.findIndex(predicate);
        if (idx !== -1) {
          adminsAndMods.splice(idx, 1);
        }
      }
      if (
        newRole.permission === 'admin' ||
        newRole.permission === 'moderator'
      ) {
        adminsAndMods.push(
          new RoleInfo(
            newRole.id,
            newRole.Address?.id || newRole.address_id,
            newRole.Address.address,
            newRole.Address.chain,
            newRole.chain_id,
            newRole.permission,
            newRole.is_user_default
          )
        );
      }
      m.redraw();
    };

    return m(
      Sublayout,
      {
        class: 'ManageCommunityPage',
        title: ['Manage Community'],
        showNewProposalButton: true,
      },
      [
        m('.manage-community-wrapper', [
          m('.panel-top', [
            vnode.state.loadingFinished &&
              m(ChainMetadataManagementTable, {
                admins,
                chain: app.config.chains.getById(app.activeChainId()),
                mods,
                onRoleUpdate: (oldRole, newRole) =>
                  onRoleUpdate(oldRole, newRole),
              }),
          ]),
          m('.panel-bottom', [
            vnode.state.loadingFinished &&
              m(AdminPanelTabs, {
                defaultTab: 1,
                onRoleUpgrade: (oldRole, newRole) =>
                  onRoleUpdate(oldRole, newRole),
                roleData: vnode.state.roleData,
                webhooks: vnode.state.webhooks,
              }),
          ]),
          app.user.isSiteAdmin && deleteChainButton(app.config.chains.getById(app.activeChainId())),
        ]),
      ]
    );
  },
};

export default ManageCommunityPage;
