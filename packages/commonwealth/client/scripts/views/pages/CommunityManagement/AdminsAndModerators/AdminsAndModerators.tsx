import { APIOrderBy, APIOrderDirection } from 'helpers/constants';
import React, { useMemo, useState } from 'react';
import app from 'state';
import useFetchAdminQuery from 'state/api/members/fetchAdmin';
import useSearchProfilesQuery, {
  SearchProfilesResponse,
} from 'state/api/profiles/searchProfiles';
import { useDebounce } from 'usehooks-ts';
import RoleInfo from '../../../../models/RoleInfo';
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

  const {
    data: members,
    isLoading: isLoadingProfiles,
    refetch,
    fetchNextPage,
  } = useSearchProfilesQuery({
    communityId: app.activeChainId(),
    searchTerm: debouncedSearchTerm,
    limit: 30,
    orderBy: APIOrderBy.LastActive,
    orderDirection: APIOrderDirection.Desc,
    includeRoles: true,
  });

  const roleData = useMemo(() => {
    if (!members?.pages?.length) {
      return [];
    }
    const clonedMembersPages = [...members.pages];

    const results = clonedMembersPages
      .reduce((acc, page) => {
        return [...acc, ...page.results];
      }, [] as SearchProfilesResponse['results'])
      .map((profile) => {
        return {
          ...(profile.roles[0] || {}),
          Address: profile.addresses[0],
          id: profile.addresses[0].id,
          displayName: profile.profile_name || 'Anonymous',
        };
      });
    return results;
  }, [members]);

  const refetchMembers = () => {
    if (members?.pages?.[0]?.totalResults > roleData.length) {
      fetchNextPage();
    }
  };
  // useEffect(() => {
  //   if (!isFetchAdminQueryLoading && returnedAdmins.length > 0) {
  //     setAdmins(returnedAdmins);
  //   }
  //   if (!isFetchAdminQueryLoading && returnedMods.length > 0) {
  //     setMods(returnedMods);
  //   }
  // }, [returnedAdmins, returnedMods, isFetchAdminQueryLoading]);

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
        community_id: newRole.chain_id,
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
            roledata={returnedAdmins}
            onRoleUpdate={handleRoleUpdate}
          />
          <ManageRoles
            label="Moderators"
            roledata={returnedMods}
            onRoleUpdate={handleRoleUpdate}
          />
          <UpgradeRolesForm
            label="Members"
            roleData={roleData}
            refetchMembers={refetchMembers}
            onRoleUpdate={handleRoleUpdate}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isLoadingProfiles={isLoadingProfiles}
          />
        </section>
      )}
    </CommunityManagementLayout>
  );
};

export default AdminsAndModerators;
