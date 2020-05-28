import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import { sortAdminsAndModsFirst } from 'views/pages/discussions/roles';
import { RolePermission, RoleInfo } from 'models';
import AdminTabPanel from './admin_tab_panel';
import CommunityMetadataManagementTable from './community_metadata_management_table';
import ChainMetadataManagementTable from './chain_metadata_management_table';

interface IAdminPanelContentsState {
  roleData: RoleInfo[];
  webhooks;
  loadingFinished: boolean;
  loadingStarted: boolean;
}

const AdminPanelContents: m.Component<{onChangeHandler: Function}, IAdminPanelContentsState> = {
  view: (vnode) => {
    const chainOrCommObj = app.chain ? { chain: app.activeChainId() } : { community: app.activeCommunityId() };
    const isCommunity = !!app.activeCommunityId();
    const loadRoles = async () => {
      try {
        const bulkMembers = await $.get(`${app.serverUrl()}/bulkMembers`, chainOrCommObj);
        if (bulkMembers.status !== 'Success') throw new Error('Could not fetch members');
        const webhooks = await $.get(`${app.serverUrl()}/getWebhooks`,
          { ...chainOrCommObj, auth: true, jwt: app.login.jwt });
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
      m.redraw();
    };

    return m('.AdminPanelContents', [
      m('.panel-left', [
        isCommunity
          ? vnode.state.loadingFinished
            && m(CommunityMetadataManagementTable, {
              community: app.community.meta,
              admins,
              mods,
              onRoleUpdate: (oldRole, newRole) => onRoleUpdate(oldRole, newRole),
              onChangeHandler: vnode.attrs.onChangeHandler,
            })
          : vnode.state.loadingFinished
            && m(ChainMetadataManagementTable, {
              chain: app.config.chains.getById(app.activeChainId()),
              admins,
              mods,
              onChangeHandler: vnode.attrs.onChangeHandler,
              onRoleUpdate: (oldRole, newRole) => onRoleUpdate(oldRole, newRole),
            }),
      ]),
      m('.panel-right', [
        vnode.state.loadingFinished
          && m(AdminTabPanel, {
            roleData: vnode.state.roleData,
            defaultTab: 1,
            onRoleUpgrade: (oldRole, newRole) => onRoleUpdate(oldRole, newRole),
            webhooks: vnode.state.webhooks,
          }),
      ]),
    ]);
  }
};

export default AdminPanelContents;
