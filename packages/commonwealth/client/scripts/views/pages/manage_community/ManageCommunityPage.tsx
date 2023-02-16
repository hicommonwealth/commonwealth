import $ from 'jquery';

import { AccessLevel, RoleInfo } from 'models';

import 'pages/manage_community/index.scss';
import React, { useEffect, useState } from 'react';

import app from 'state';
import Sublayout from '../../sublayout';
import ErrorPage from '../error';
import { PageLoading } from '../loading';
import { AdminPanelTabs } from './admin_panel_tabs';
import { ChainMetadataRows } from './chain_metadata_rows';
import { sortAdminsAndModsFirst } from './helpers';

const ManageCommunityPage = () => {
  const [initialized, setInitialized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleData, setRoleData] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [mods, setMods] = useState([]);

  useEffect(() => {
      if (!app.activeChainId()) {
        return;
      }

      setIsAdmin(
        app.user.isSiteAdmin ||
        app.roles.isAdminOfEntity({
          chain: app.activeChainId(),
        })
      );

      const chainOrCommObj = { chain: app.activeChainId() };
      Promise.all([
        // TODO: Change to GET /members
        $.get(`${app.serverUrl()}/bulkMembers`, chainOrCommObj),
        // TODO: Change to GET /webhooks
        $.get(`${app.serverUrl()}/getWebhooks`, { ...chainOrCommObj, auth: true, jwt: app.user.jwt })
      ]).then(([bulkMembers, webhooksResp]) => {
        if (bulkMembers.status !== 'Success') {
          throw new Error('Could not fetch members');
        }

        if (webhooksResp.status !== 'Success') {
          throw new Error('Could not fetch community webhooks');
        }

        setWebhooks(webhooksResp);

        const memberAdmins = [];
        const memberMods = [];

        if (bulkMembers?.length > 0) {
          bulkMembers.sort(sortAdminsAndModsFirst).forEach((role) => {
            if (role.permission === AccessLevel.Admin) {
              memberAdmins.push(role);
            } else if (role.permission === AccessLevel.Moderator) {
              memberMods.push(role);
            }
          });
        }

        setAdmins(memberAdmins);
        setMods(memberMods);

        setRoleData(bulkMembers);
        setInitialized(true);
      }).catch(() => {
        setRoleData([]);
        setWebhooks([]);
        setInitialized(true);
      });

    },
    []);

  if (!initialized) return <PageLoading/>;
  if (!isAdmin) return <ErrorPage message={'Must be admin'}/>;

  return <Sublayout
    // title="Manage Community"
  >
    <div className="ManageCommunityPage">
      <ChainMetadataRows
        admins={admins}
        chain={app.config.chains.getById(app.activeChainId())}
        mods={mods}
        onRoleUpdate={(oldRole, newRole) => onRoleUpdate(oldRole, newRole, (r) => setRoleData(r), roleData)}
        onSave={() => {
          setAdmins(admins); // dummy state update to make react refresh
        }}
      />
      <AdminPanelTabs
        onRoleUpgrade={(oldRole, newRole) => onRoleUpdate(oldRole, newRole, (r) => setRoleData(r), roleData)}
        roleData={roleData}
        webhooks={webhooks}
      />
    </div>
  </Sublayout>;
};

const onRoleUpdate = (oldRole, newRole, setRoleData, roleData) => {
  // newRole doesn't have the Address property that oldRole has,
  // Add the missing Address property to the newRole, then splice it into the array.
  newRole.Address = oldRole.Address;

  const predicate = (r) => {
    return r.id === oldRole.id;
  };

  setRoleData(roleData.splice(roleData.indexOf(oldRole), 1, newRole));
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
};

export default ManageCommunityPage;