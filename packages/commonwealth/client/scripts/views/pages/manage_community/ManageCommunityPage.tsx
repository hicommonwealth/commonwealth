import axios from 'axios';
import useForceRerender from 'hooks/useForceRerender';
import 'pages/manage_community/index.scss';
import React, { useEffect, useMemo, useState } from 'react';
import app from 'state';
import { useDebounce } from 'usehooks-ts';
import { AccessLevel } from '../../../../../shared/permissions';
import NewProfilesController from '../../../controllers/server/newProfiles';
import { TTLCache } from '../../../helpers/ttl_cache';
import RoleInfo from '../../../models/RoleInfo';
import Permissions from '../../../utils/Permissions';
import { PageLoading } from '../loading';
import { AdminPanelTabs } from './admin_panel_tabs';
import { ChainMetadataRows } from './chain_metadata_rows';

const ManageCommunityPage = () => {
  const forceRerender = useForceRerender();
  const [initialized, setInitialized] = useState(false);
  const [roleData, setRoleData] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [mods, setMods] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce<string>(searchTerm, 500);

  const membersCache = useMemo(() => {
    return new TTLCache(
      1_000 * 60,
      `manage-community-members-${app.activeChainId()}`
    );
  }, []);

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

  const searchMembers = async (searchQuery?: string) => {
    try {
      let profiles = [];

      const cachedResult = membersCache.get(searchQuery);
      if (cachedResult) {
        profiles = cachedResult.profiles;
      } else {
        const res = await axios.get(`${app.serverUrl()}/searchProfiles`, {
          params: {
            chain: app.activeChainId(),
            search: searchQuery || '',
            page_size: 100,
            page: 1,
            include_roles: true,
          },
        });
        if (res.data.status !== 'Success') {
          throw new Error('Could not fetch members');
        }
        membersCache.set(searchQuery, res.data.result);
        profiles = res.data.result.profiles;
      }

      let roles = [];

      if (profiles.length > 0) {
        roles = profiles.map((profile) => {
          return {
            ...(profile.roles[0] || {}),
            Address: profile.addresses[0],
            id: profile.addresses[0].id,
          };
        });
      }
      setRoleData(roles);
      setInitialized(true);
    } catch (err) {
      setRoleData([]);
      setInitialized(true);
    }
  };

  useEffect(() => {
    NewProfilesController.Instance.isFetched.on('redraw', () =>
      forceRerender()
    );

    NewProfilesController.Instance.isFetched.off('redraw', forceRerender);
  }, [forceRerender]);

  // on update debounced search term, fetch
  useEffect(() => {
    searchMembers(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  // on init, fetch
  useEffect(() => {
    if (!app.activeChainId()) {
      return;
    }

    fetchAdmins();
    searchMembers();
  }, []);

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  if (!initialized) {
    return <PageLoading />;
  }

  // if (!isAdmin) {
  //   return <ErrorPage message={'Must be admin'} />;
  // }

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
      const roleInfo = new RoleInfo(
        newRole.address_id,
        newRole.Address?.id || newRole.address_id,
        newRole.Address.address,
        newRole.Address.chain,
        newRole.chain_id,
        newRole.permission,
        newRole.allow,
        newRole.deny,
        newRole.is_user_default
      );
      adminsAndMods.push(roleInfo);

      if (newRole.permission === 'admin') {
        setAdmins([...admins, newRole]);
      }
      if (newRole.permission === 'moderator') {
        setMods([...mods, newRole]);
      }
    }

    searchMembers();
  };

  return (
    <div className="ManageCommunityPage">
      <ChainMetadataRows
        admins={admins}
        chain={app.config.chains.getById(app.activeChainId())}
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
