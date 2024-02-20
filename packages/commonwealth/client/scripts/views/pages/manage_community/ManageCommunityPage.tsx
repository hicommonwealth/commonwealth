import { AccessLevel } from '@hicommonwealth/core';
import axios from 'axios';
import useForceRerender from 'hooks/useForceRerender';
import 'pages/manage_community/index.scss';
import React, { useEffect, useMemo, useState } from 'react';
import app from 'state';
import { useDebounce } from 'usehooks-ts';
import {
  APIOrderBy,
  APIOrderDirection,
} from '../../../../scripts/helpers/constants';
import { useSearchProfilesQuery } from '../../../../scripts/state/api/profiles';
import NewProfilesController from '../../../controllers/server/newProfiles';
import RoleInfo from '../../../models/RoleInfo';
import Permissions from '../../../utils/Permissions';
import { CWText } from '../../components/component_kit/cw_text';
import ErrorPage from '../error';
import { AdminPanelTabs } from './admin_panel_tabs';
import { CommunityMetadataRows } from './community_metadata_rows';

const ManageCommunityPage = () => {
  const forceRerender = useForceRerender();
  const [admins, setAdmins] = useState([]);
  const [mods, setMods] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce<string>(searchTerm, 500);

  const fetchAdmins = async () => {
    const memberAdmins = [];
    const memberMods = [];

    try {
      const res = await axios.get(`${app.serverUrl()}/roles`, {
        params: {
          chain_id: app.activeChainId(),
          permissions: ['moderator', 'admin'],
        },
      });
      const roles = res.data.result || [];
      roles.forEach((role) => {
        if (role.permission === AccessLevel.Admin) {
          memberAdmins.push(role);
        } else if (role.permission === AccessLevel.Moderator) {
          memberMods.push(role);
        }
      });
    } catch (err) {
      console.error(err);
    }

    setAdmins(memberAdmins);
    setMods(memberMods);
  };

  const { data: searchResults, refetch } = useSearchProfilesQuery({
    communityId: app.activeChainId(),
    searchTerm: debouncedSearchTerm,
    limit: 20,
    orderBy: APIOrderBy.LastActive,
    orderDirection: APIOrderDirection.Desc,
    includeRoles: true,
  });

  const roleData = useMemo(() => {
    if (!searchResults?.pages?.length) {
      return [];
    }
    return searchResults.pages[0].results.map((profile) => {
      return {
        ...(profile.roles[0] || {}),
        Address: profile.addresses[0],
        id: profile.addresses[0].id,
        displayName: profile.profile_name || 'Anonymous',
      };
    });
  }, [searchResults]);

  useEffect(() => {
    NewProfilesController.Instance.isFetched.on('redraw', () =>
      forceRerender(),
    );

    NewProfilesController.Instance.isFetched.off('redraw', forceRerender);
  }, [forceRerender]);

  // on init, fetch
  useEffect(() => {
    if (!app.activeChainId()) {
      return;
    }
    fetchAdmins();
  }, []);

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  if (!isAdmin) {
    return <ErrorPage message="Must be admin" />;
  }

  type MinRoleData = {
    id: number;
    address_id: number;
    address: string;
    community_id: string;
  };
  const handleRoleUpdate = (oldRole, newRole) => {
    // newRole doesn't have the Address property that oldRole has,
    // Add the missing Address property to the newRole, then splice it into the array.
    newRole.Address = oldRole.Address;

    const predicate = (r) => {
      return r.address_id === oldRole.address_id;
    };

    app.roles.addRole(newRole);
    app.roles.removeRole(predicate);

    const { adminsAndMods } = app.chain.meta;

    if (oldRole.permission === 'admin' || oldRole.permission === 'moderator') {
      const idx = adminsAndMods.findIndex(predicate);

      if (idx !== -1) {
        adminsAndMods.splice(idx, 1);
      }
      if (oldRole.permission === 'admin') {
        setAdmins(admins.filter((a) => a.address_id !== oldRole.address_id));
      }
      if (oldRole.permission === 'moderator') {
        setMods(mods.filter((a) => a.address_id !== oldRole.address_id));
      }
    }

    if (newRole.permission === 'admin' || newRole.permission === 'moderator') {
      const roleInfo = new RoleInfo({
        id: newRole.address_id,
        address_id: newRole.Address?.id || newRole.address_id,
        address: newRole.Address.address,
        address_chain: newRole.Address.community_id,
        chain_id: newRole.chain_id,
        permission: newRole.permission,
        allow: newRole.allow,
        deny: newRole.deny,
        is_user_default: newRole.is_user_default,
      });
      adminsAndMods.push(roleInfo);

      if (newRole.permission === 'admin') {
        setAdmins([...admins, newRole]);
      }
      if (newRole.permission === 'moderator') {
        setMods([...mods, newRole]);
      }
    }

    refetch();
  };

  return (
    <div className="ManageCommunityPage">
      <CWText type="h2" fontWeight="medium" className="header">
        Manage Community
      </CWText>
      <CommunityMetadataRows
        admins={admins}
        community={app.config.chains.getById(app.activeChainId())}
        mods={mods}
        onRoleUpdate={handleRoleUpdate}
        onSave={() => forceRerender()}
      />
      <AdminPanelTabs
        onRoleUpdate={handleRoleUpdate}
        roleData={roleData}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
    </div>
  );
};

export default ManageCommunityPage;
