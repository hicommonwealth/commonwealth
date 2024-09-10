import { AddressRole } from '@hicommonwealth/shared';
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
import { ComponentType } from '../../../components/component_kit/types';
import CommunityManagementLayout from '../common/CommunityManagementLayout';
import ManageRoles from './ManageRoles';
import UpgradeRolesForm from './UpgradeRolesForm';

const AdminsAndModerators = () => {
  const [admins, setAdmins] = useState<AddressRole[]>([]);
  const [mods, setMods] = useState<AddressRole[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const adminsAndModeratorsClass = true;

  const debouncedSearchTerm = useDebounce<string>(searchTerm, 500);

  const communityId = app.activeChainId() || '';
  const {
    data: { admins: returnedAdmins, mods: returnedMods } = {},
    isLoading: isFetchAdminQueryLoading,
    refetch: refetchAdminData,
  } = useFetchAdminQuery({
    communityId,
    apiEnabled: !!communityId,
  });

  const { data: searchResults, refetch } = useSearchProfilesQuery({
    communityId,
    searchTerm: debouncedSearchTerm,
    limit: 100,
    orderBy: APIOrderBy.LastActive,
    orderDirection: APIOrderDirection.Desc,
    enabled: !!communityId,
  });

  const roleData = useMemo(() => {
    if (!searchResults?.pages?.length) {
      return [];
    }
    return searchResults.pages[0].results;
  }, [searchResults]);

  useEffect(() => {
    if (!isFetchAdminQueryLoading && returnedAdmins) {
      setAdmins(
        returnedAdmins.map(({ address, role }) => ({
          address,
          role,
        })),
      );
    }
    if (!isFetchAdminQueryLoading && returnedMods) {
      setMods(
        returnedMods.map(({ address, role }) => ({
          address,
          role,
        })),
      );
    }
  }, [returnedAdmins, returnedMods, isFetchAdminQueryLoading]);

  const handleRoleUpdate = (oldRole: AddressRole, newRole: AddressRole) => {
    const { adminsAndMods } = app.chain.meta;

    if (oldRole.role === 'admin' || oldRole.role === 'moderator') {
      const idx = adminsAndMods.findIndex(
        ({ address }) => address === oldRole.address,
      );

      if (idx !== -1) {
        adminsAndMods.splice(idx, 1);
      }
      if (oldRole.role === 'admin') {
        setAdmins(admins.filter((a) => a.address !== oldRole.address));
      }
      if (oldRole.role === 'moderator') {
        setMods(mods.filter((a) => a.address !== oldRole.address));
      }
    }

    if (newRole.role === 'admin' || newRole.role === 'moderator') {
      adminsAndMods.push({
        address: newRole.address,
        role: newRole.role,
      });

      if (newRole.role === 'admin') {
        setAdmins([...admins, newRole]);
      }
      if (newRole.role === 'moderator') {
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
