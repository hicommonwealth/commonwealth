import React, { useEffect, useMemo, useState } from 'react';
import app from 'state';
import useFetchAdminQuery from 'state/api/members/fetchAdmin';
import { useDebounce } from 'usehooks-ts';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  APIOrderBy,
  APIOrderDirection,
} from '../../../../../scripts/helpers/constants';
import useSearchProfilesQuery from '../../../../../scripts/state/api/profiles/searchProfiles';
import RoleInfo from '../../../../models/RoleInfo';
import { ComponentType } from '../../../components/component_kit/types';
import CommunityManagementLayout from '../common/CommunityManagementLayout';
import ManageRoles from './ManageRoles';
import UpgradeRolesForm from './UpgradeRolesForm';

const AdminsAndModerators = () => {
  const [admins, setAdmins] = useState([]);
  const [mods, setMods] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const adminsAndModeratorsClass = true;

  const debouncedSearchTerm = useDebounce<string>(searchTerm, 500);

  const {
    data: { admins: returnedAdmins, mods: returnedMods } = {},
    isLoading: isFetchAdminQueryLoading,
    refetch: refetchAdminData,
  } = useFetchAdminQuery({
    communityId: app.activeChainId(),
  });

  const { data: searchResults, refetch } = useSearchProfilesQuery({
    communityId: app.activeChainId(),
    searchTerm: debouncedSearchTerm,
    limit: 100,
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
        // @ts-expect-error StrictNullChecks
        ...(profile.roles[0] || {}),
        Address: profile.addresses[0],
        id: profile.addresses[0].id,
        displayName: profile.profile_name || 'Anonymous',
      };
    });
  }, [searchResults]);

  useEffect(() => {
    // @ts-expect-error StrictNullChecks
    if (!isFetchAdminQueryLoading && returnedAdmins.length > 0) {
      // @ts-expect-error StrictNullChecks
      setAdmins(returnedAdmins);
    }
    // @ts-expect-error StrictNullChecks
    if (!isFetchAdminQueryLoading && returnedMods.length > 0) {
      // @ts-expect-error StrictNullChecks
      setMods(returnedMods);
    }
  }, [returnedAdmins, returnedMods, isFetchAdminQueryLoading]);

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
        // @ts-expect-error StrictNullChecks
        setAdmins(admins.filter((a) => a.address_id !== oldRole.address_id));
      }
      if (oldRole.permission === 'moderator') {
        // @ts-expect-error StrictNullChecks
        setMods(mods.filter((a) => a.address_id !== oldRole.address_id));
      }
    }

    if (newRole.permission === 'admin' || newRole.permission === 'moderator') {
      const roleInfo = new RoleInfo({
        id: newRole.address_id,
        address_id: newRole.Address?.id || newRole.address_id,
        address: newRole.Address.address,
        address_chain: newRole.Address.community_id,
        community_id: newRole.chain_id,
        permission: newRole.permission,
        allow: newRole.allow,
        deny: newRole.deny,
        is_user_default: newRole.is_user_default,
      });
      adminsAndMods.push(roleInfo);

      if (newRole.permission === 'admin') {
        // @ts-expect-error StrictNullChecks
        setAdmins([...admins, newRole]);
      }
      if (newRole.permission === 'moderator') {
        // @ts-expect-error StrictNullChecks
        setMods([...mods, newRole]);
      }
    }
    refetch();
    refetchAdminData();
  };

  return (
    <CommunityManagementLayout
      className={adminsAndModeratorsClass}
      title="Admins and Moderators"
      description="Let's start with some basic information about your community"
      featureHint={{
        title: 'Admins vs Mods',
        description: `Administrators can make changes to the community settings whereas 
        moderators can only make changes to content by locking and deleting.`,
      }}
    >
      {isFetchAdminQueryLoading ? (
        <p>Loading admins and moderators...</p>
      ) : (
        <section className="admins-moderators">
          <ManageRoles
            label="Admins"
            roledata={admins}
            onRoleUpdate={handleRoleUpdate}
          />
          <ManageRoles
            label="Moderators"
            roledata={mods}
            onRoleUpdate={handleRoleUpdate}
          />
          <CWText type="caption" className={ComponentType.Label}>
            Members
          </CWText>

          <UpgradeRolesForm
            roleData={roleData}
            onRoleUpdate={handleRoleUpdate}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </section>
      )}
    </CommunityManagementLayout>
  );
};

export default AdminsAndModerators;
