import axios from 'axios';
import useForceRerender from 'hooks/useForceRerender';
import 'pages/manage_community/index.scss';
import React, { useEffect, useMemo, useState } from 'react';
import app from 'state';
import { useDebounce } from 'usehooks-ts';
import { AccessLevel } from '../../../../../shared/permissions';
import NewProfilesController from '../../../controllers/server/newProfiles';
import RoleInfo from '../../../models/RoleInfo';
import Permissions from '../../../utils/Permissions';
import { AdminPanelTabs } from './admin_panel_tabs';
import { ChainMetadataRows } from './chain_metadata_rows';
import { useQuery } from '@tanstack/react-query';
import ErrorPage from '../error';

type ProfilesSearchResponse = {
  results: {
    id: number;
    user_id: string;
    profile_name: string;
    avatar_url: string;
    addresses: {
      id: number;
      chain: string;
      address: string;
    }[];
    roles?: any[];
  }[];
  limit: number;
  page: number;
  totalPages: number;
  totalResults: number;
};

const orderBy = 'last_active';
const orderDirection = 'DESC';

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

  const fetchSearchResults = async ({ pageParam = 0 }) => {
    const {
      data: { result },
    } = await axios.get<{ result: ProfilesSearchResponse }>(`/api/profiles`, {
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        chain: app.activeChainId(),
        search: searchTerm,
        limit: (50).toString(),
        page: pageParam.toString(),
        order_by: orderBy,
        order_direction: orderDirection,
        include_roles: 'true',
      },
    });
    return result.results;
  };

  const { data: searchResults, refetch } = useQuery({
    queryKey: [
      'search-members-manage',
      {
        debouncedSearchTerm,
        chain: app.activeChainId(),
        orderBy,
        orderDirection,
      },
    ],
    queryFn: fetchSearchResults,
  });

  const roleData = useMemo(() => {
    if (!searchResults) {
      return [];
    }
    return searchResults.map((profile) => {
      return {
        ...(profile.roles[0] || {}),
        Address: profile.addresses[0],
        id: profile.addresses[0].id,
      };
    });
  }, [searchResults]);

  useEffect(() => {
    NewProfilesController.Instance.isFetched.on('redraw', () =>
      forceRerender()
    );

    NewProfilesController.Instance.isFetched.off('redraw', forceRerender);
  }, [forceRerender]);

  // on update debounced search term, fetch
  useEffect(() => {
    refetch();
  }, [debouncedSearchTerm]);

  // on init, fetch
  useEffect(() => {
    if (!app.activeChainId()) {
      return;
    }
    fetchAdmins();
  }, []);

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  if (!isAdmin) {
    return <ErrorPage message={'Must be admin'} />;
  }

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

    refetch();
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
