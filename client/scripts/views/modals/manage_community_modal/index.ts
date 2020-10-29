import 'modals/manage_community_modal.scss';

import m from 'mithril';
import $ from 'jquery';

import app from 'state';
import { RoleInfo, RolePermission, Webhook } from 'models';
import { CompactModalExitButton } from 'views/modal';
import { sortAdminsAndModsFirst } from 'views/pages/discussions/roles';
import CommunityMetadataManagementTable from './community_metadata_management_table';
import ChainMetadataManagementTable from './chain_metadata_management_table';
import AdminPanelTabs from './admin_panel_tabs';

const ManageCommunityModal: m.Component<{}, {
  roleData: RoleInfo[];
  webhooks: Webhook[];
  loadingFinished: boolean;
  loadingStarted: boolean;
}> = {
  view: (vnode) => {
    const chainOrCommObj = app.chain ? { chain: app.activeChainId() } : { community: app.activeCommunityId() };
    const isCommunity = !!app.activeCommunityId();
    const loadRoles = async () => {
      try {
        // TODO: Change to GET /members
        const bulkMembers = await $.get(`${app.serverUrl()}/bulkMembers`, chainOrCommObj);
        if (bulkMembers.status !== 'Success') throw new Error('Could not fetch members');
        // TODO: Change to GET /webhooks
        const webhooks = await $.get(`${app.serverUrl()}/getWebhooks`,
          { ...chainOrCommObj, auth: true, jwt: app.user.jwt });
        if (webhooks.status !== 'Success') throw new Error('Could not fetch community webhooks');
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
      vnode.state.roleData.splice(vnode.state.roleData.indexOf(oldRole), 1, newRole);
      const { adminsAndMods } = app.community ? app.community.meta : app.chain.meta.chain;
      if (oldRole.permission === 'admin' || oldRole.permission === 'moderator') {
        const idx = adminsAndMods.findIndex((r) => {
          console.log(r);
          return r.id === oldRole.id;
        });
        console.log(oldRole);
        console.log(idx);
        if (idx) {
          adminsAndMods.splice(idx, 1);
        }
      }
      if (newRole.permission === 'admin' || newRole.permission === 'moderator') {
        adminsAndMods.push(newRole);
      }
      m.redraw();
    };

    return m('.ManageCommunityModal', [
      m('.compact-modal-title', [
        m('h3', 'Manage Community'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body-max', [
        m('.panel-left', [
          isCommunity
            ? vnode.state.loadingFinished
              && m(CommunityMetadataManagementTable, {
                admins,
                community: app.community.meta,
                mods,
                onRoleUpdate: (oldRole, newRole) => onRoleUpdate(oldRole, newRole),
              })
            : vnode.state.loadingFinished
              && m(ChainMetadataManagementTable, {
                admins,
                chain: app.config.chains.getById(app.activeChainId()),
                mods,
                onRoleUpdate: (oldRole, newRole) => onRoleUpdate(oldRole, newRole),
              }),
        ]),
        m('.panel-right', [
          vnode.state.loadingFinished
            && m(AdminPanelTabs, {
              defaultTab: 1,
              onRoleUpgrade: (oldRole, newRole) => onRoleUpdate(oldRole, newRole),
              roleData: vnode.state.roleData,
              webhooks: vnode.state.webhooks,
            }),
        ]),
      ]),
    ]);
  },
};

export default ManageCommunityModal;
