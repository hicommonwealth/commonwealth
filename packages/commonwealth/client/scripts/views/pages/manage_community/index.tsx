import React from 'react';

import { redraw } from 'mithrilInterop';
import $ from 'jquery';
import m from 'mithril';

import 'pages/manage_community/index.scss';

import app from 'state';
import { navigateToSubpage } from 'router';
import { AccessLevel, RoleInfo } from 'models';
import type { Webhook } from 'models';
import { ChainMetadataRows } from './chain_metadata_rows';
import { AdminPanelTabs } from './admin_panel_tabs';
import Sublayout from '../../sublayout';
import { PageLoading } from '../loading';
import { sortAdminsAndModsFirst } from './helpers';

const ManageCommunityPage = () => {
  const [loadingFinished, setLoadingFinished] = React.useState<boolean>(false);
  const [loadingStarted, setLoadingStarted] = React.useState<boolean>(false);
  const [roleData, setRoleData] = React.useState<Array<RoleInfo>>();
  const [webhooks, setWebhooks] = React.useState<Array<Webhook>>();

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
      const webhooksResponse = await $.get(`${app.serverUrl()}/getWebhooks`, {
        ...chainOrCommObj,
        auth: true,
        jwt: app.user.jwt,
      });

      if (webhooksResponse.status !== 'Success') {
        throw new Error('Could not fetch community webhooks');
      }

      setWebhooks(webhooksResponse.result);
      setRoleData(bulkMembers.result);
      setLoadingFinished(true);
      redraw();
    } catch (err) {
      setRoleData([]);
      setLoadingFinished(true);
      redraw();
      console.error(err);
    }
  };

  if (!loadingStarted) {
    setLoadingStarted(true);
    loadRoles();
  }

  const admins = [];
  const mods = [];

  if (roleData?.length > 0) {
    roleData.sort(sortAdminsAndModsFirst).forEach((role) => {
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

    roleData.splice(roleData.indexOf(oldRole), 1, newRole);
    app.roles.addRole(newRole);
    app.roles.removeRole(predicate);

    const { adminsAndMods } = app.chain.meta;

    if (oldRole.permission === 'admin' || oldRole.permission === 'moderator') {
      const idx = adminsAndMods.findIndex(predicate);

      if (idx !== -1) {
        adminsAndMods.splice(idx, 1);
      }
    }

    if (newRole.permission === 'admin' || newRole.permission === 'moderator') {
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

    redraw();
  };

  const onSave = () => {
    redraw();
  };

  return !loadingFinished ? (
    <PageLoading />
  ) : (
    <Sublayout>
      <div className="ManageCommunityPage">
        <ChainMetadataRows
          admins={admins}
          chain={app.config.chains.getById(app.activeChainId())}
          mods={mods}
          onRoleUpdate={(oldRole, newRole) => onRoleUpdate(oldRole, newRole)}
          onSave={() => onSave()}
        />
        <AdminPanelTabs
          onRoleUpgrade={(oldRole, newRole) => onRoleUpdate(oldRole, newRole)}
          roleData={roleData}
          webhooks={webhooks}
        />
      </div>
    </Sublayout>
  );
};

export default ManageCommunityPage;
