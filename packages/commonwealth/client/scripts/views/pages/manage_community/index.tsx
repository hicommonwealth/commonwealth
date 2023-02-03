/* @jsx m */

import ClassComponent from 'class_component';
import $ from 'jquery';
import m from 'mithril';

import 'pages/manage_community/index.scss';

import app from 'state';
import { navigateToSubpage } from 'router';
import { AccessLevel, RoleInfo, Webhook } from 'models';
import { ChainMetadataRows } from './chain_metadata_rows';
import { AdminPanelTabs } from './admin_panel_tabs';
import Sublayout from '../../sublayout';
import { PageLoading } from '../loading';
import { sortAdminsAndModsFirst } from './helpers';

class ManageCommunityPage extends ClassComponent {
  private loadingFinished: boolean;
  private loadingStarted: boolean;
  private roleData: Array<RoleInfo>;
  private webhooks: Array<Webhook>;

  view() {
    if (!app.activeChainId()) {
      return;
    }

    const isAdmin =
      app.user.isSiteAdmin ||
      app.roles.isAdminOfEntity({
        chain: app.activeChainId(),
      });

    if (!isAdmin) {
      navigateToSubpage(``);
    }

    const chainOrCommObj = { chain: app.activeChainId() };

    const loadRoles = async () => {
      try {
        // TODO: Change to GET /members
        const bulkMembers = await $.get(
          `${app.serverUrl()}/bulkMembers`,
          chainOrCommObj
        );

        if (bulkMembers.status !== 'Success') {
          throw new Error('Could not fetch members');
        }
        // TODO: Change to GET /webhooks
        const webhooks = await $.get(`${app.serverUrl()}/getWebhooks`, {
          ...chainOrCommObj,
          auth: true,
          jwt: app.user.jwt,
        });

        if (webhooks.status !== 'Success') {
          throw new Error('Could not fetch community webhooks');
        }

        this.webhooks = webhooks.result;
        this.roleData = bulkMembers.result;
        this.loadingFinished = true;
        m.redraw();
      } catch (err) {
        this.roleData = [];
        this.loadingFinished = true;
        m.redraw();
        console.error(err);
      }
    };

    if (!this.loadingStarted) {
      this.loadingStarted = true;
      loadRoles();
    }

    const admins = [];
    const mods = [];

    if (this.roleData?.length > 0) {
      this.roleData.sort(sortAdminsAndModsFirst).forEach((role) => {
        if (role.permission === AccessLevel.Admin) {
          admins.push(role);
        } else if (role.permission === AccessLevel.Moderator) {
          mods.push(role);
        }
      });
    }

    const onRoleUpdate = (oldRole, newRole) => {
      // newRole doesn't have the Address property that oldRole has,
      // Add the missing Address property to the newRole, then splice it into the array.
      newRole.Address = oldRole.Address;

      const predicate = (r) => {
        return r.id === oldRole.id;
      };

      this.roleData.splice(this.roleData.indexOf(oldRole), 1, newRole);
      app.roles.addRole(newRole);
      app.roles.removeRole(predicate);

      const { adminsAndMods } = app.chain.meta;

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
            newRole.allow,
            newRole.deny,
            newRole.is_user_default
          )
        );
      }

      m.redraw();
    };

    const onSave = () => {
      m.redraw();
    };

    return !this.loadingFinished ? (
      <PageLoading />
    ) : (
      <Sublayout
      // title="Manage Community"
      >
        <div class="ManageCommunityPage">
          <ChainMetadataRows
            admins={admins}
            chain={app.config.chains.getById(app.activeChainId())}
            mods={mods}
            onRoleUpdate={(oldRole, newRole) => onRoleUpdate(oldRole, newRole)}
            onSave={() => onSave()}
          />
          <AdminPanelTabs
            defaultTab={1}
            onRoleUpgrade={(oldRole, newRole) => onRoleUpdate(oldRole, newRole)}
            roleData={this.roleData}
            webhooks={this.webhooks}
          />
        </div>
      </Sublayout>
    );
  }
}

export default ManageCommunityPage;
