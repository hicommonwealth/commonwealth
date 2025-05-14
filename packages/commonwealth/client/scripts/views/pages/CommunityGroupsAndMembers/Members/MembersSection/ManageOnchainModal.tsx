import { Role } from '@hicommonwealth/shared';
import {
  notifyError,
  notifySuccess,
} from 'client/scripts/controllers/app/notifications';
import { formatAddressShort } from 'client/scripts/helpers';
import {
  useGetCommunityByIdQuery,
  useUpdateRoleMutation,
} from 'client/scripts/state/api/communities';
import useMintAdminTokenMutation from 'client/scripts/state/api/members/mintAdminRoleonChain';
import useUserStore from 'client/scripts/state/ui/user';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from 'client/scripts/views/components/component_kit/new_designs/CWModal';
import { CWSelectList } from 'client/scripts/views/components/component_kit/new_designs/CWSelectList/CWSelectList';
import {
  CWTab,
  CWTabsRow,
} from 'client/scripts/views/components/component_kit/new_designs/CWTabs';
import useCommunityContests from 'client/scripts/views/pages/CommunityManagement/Contests/useCommunityContests';
import React, { useMemo, useState } from 'react';
import app from 'state';
import { AddressItem, RadioOption } from './AddressItem';
import './ManageOnchainModal.scss';
import { AddressInfo } from './MembersSection';

type ManageOnchainModalProps = {
  onClose: () => void;
  Addresses: AddressInfo[] | undefined;
  refetch?: () => void;
  namespace: string;
  chainRpc: string;
  ethChainId: number;
  chainId: string;
  communityNamespace: boolean;
};

type ContestOption = {
  label: string;
  value: string;
};

export const ManageOnchainModal = ({
  onClose,
  Addresses,
  refetch,
  namespace,
  chainRpc,
  ethChainId,
  chainId,
  communityNamespace,
}: ManageOnchainModalProps) => {
  const [userRole, setUserRole] = useState(Addresses);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('adminId');
  const [selectedContest, setSelectedContest] = useState<ContestOption | null>(
    null,
  );
  const { mutateAsync: updateRole } = useUpdateRoleMutation();

  const userData = useUserStore();
  const mintAdminTokenMutation = useMintAdminTokenMutation();

  const { contestsData, isContestDataLoading } = useCommunityContests({
    shouldPolling: false,
    fetchAll: false,
  });

  const { data: community } = useGetCommunityByIdQuery({
    id: chainId,
    enabled: !!chainId,
  });

  const contestOptions = useMemo<ContestOption[]>(() => {
    const allOptions: ContestOption[] = [];

    if (contestsData?.active && contestsData.active.length > 0) {
      contestsData.active.forEach((contest) => {
        console.log(contest);
        if (contest.contests) {
          contest.contests.forEach(() => {
            allOptions.push({
              label: contest.name || '',
              value: contest.contest_address || '',
            });
          });
        }
      });
    }

    return allOptions;
  }, [contestsData]);

  const hasActiveContests = contestOptions.length > 0;

  const handleRoleChange = (id: number, newRole: string) => {
    setUserRole((prevData) =>
      (prevData || []).map((user) => {
        if (user.id === id && user.role !== newRole) {
          setHasChanges(true);
          return { ...user, role: newRole };
        }
        return user;
      }),
    );
  };

  const updateRolesOnServer = async () => {
    if (!hasChanges) return;
    try {
      setLoading(true);
      if (!userRole || !Addresses) return;
      const updates = userRole.filter(
        (user, index) => user.role !== Addresses[index]?.role,
      );
      if (updates.length === 0) return;
      await Promise.all(
        updates.map(({ role, address }) =>
          updateRole({
            community_id: app.activeChainId()!,
            address,
            role: role as Role,
          }),
        ),
      );
      if (refetch) refetch();
    } catch (error) {
      console.error('Error upgrading members:', error);
      notifyError(error?.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const mintPermission = async () => {
    try {
      const walletAddress = userData.activeAccount?.address;
      if (!walletAddress) {
        notifyError('Wallet Address Not Found');
        throw new Error('Wallet Address Not Found');
      }

      // Filter the updates to only those that are admin changes
      const adminUpdates = (userRole || []).filter(
        (user, index) =>
          user.role !== Addresses?.[index]?.role && user.role === 'admin',
      );

      if (adminUpdates.length > 0) {
        await Promise.all(
          adminUpdates.map(async (update) => {
            await mintAdminTokenMutation.mutateAsync({
              namespace,
              walletAddress,
              adminAddress: update.address,
              chainRpc,
              ethChainId,
              chainId,
            });
            notifySuccess(
              `Admin token minted for ${formatAddressShort(update.address)}`,
            );
          }),
        );
      }
    } catch (error) {
      console.error('Error minting permissions:', error);
      notifyError(error?.response?.data?.error || error.message);
      throw new Error(error);
    }
  };

  const handleUpdate = async () => {
    try {
      if (communityNamespace) await mintPermission();
      await updateRolesOnServer();
    } catch (err) {
      console.error(err);
      notifyError('Minting failed, permissions were not updated.');
    } finally {
      onClose();
    }
  };

  const handleContestSelect = (option: ContestOption) => {
    setSelectedContest(option);
    setHasChanges(true);
  };

  const getRadioOptions = (address: AddressInfo): RadioOption[] => {
    return [
      { label: 'Admin', value: 'admin', checked: address.role === 'admin' },
      { label: 'Member', value: 'member', checked: address.role === 'member' },
    ];
  };

  return (
    <div className="ManageOnchainModal">
      <CWModalHeader
        label={communityNamespace ? 'Manage onchain privileges' : 'Manage Role'}
        subheader={communityNamespace ? 'This action cannot be undone.' : ''}
        onModalClose={onClose}
      />
      <CWModalBody>
        <CWTabsRow>
          <CWTab
            label="Admin ID"
            isSelected={activeTab === 'adminId'}
            onClick={() => setActiveTab('adminId')}
          />
          <CWTab
            label="Judged Contest"
            isSelected={activeTab === 'judgedContest'}
            onClick={() => setActiveTab('judgedContest')}
          />
        </CWTabsRow>

        {activeTab === 'adminId' && (
          <div className="address-list">
            {userRole?.map((address) => (
              <AddressItem
                key={address.id}
                address={address}
                communityBase={community?.base}
                radioOptions={getRadioOptions(address)}
                onRoleChange={handleRoleChange}
              />
            ))}
          </div>
        )}

        {activeTab === 'judgedContest' && (
          <div className="judged-contest-content">
            {isContestDataLoading ? (
              <CWText type="b1">Loading contests...</CWText>
            ) : hasActiveContests ? (
              <CWSelectList
                label="Select Contest to Judge"
                options={contestOptions}
                value={selectedContest}
                onChange={handleContestSelect}
                placeholder="Select a contest..."
              />
            ) : (
              <CWText type="b1">No active contests available.</CWText>
            )}
          </div>
        )}
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          label={communityNamespace ? 'Confirm & Mint' : 'Confirm'}
          buttonType="secondary"
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={handleUpdate}
          buttonHeight="sm"
          disabled={loading || !hasChanges}
        />
        <CWButton label="Close" onClick={onClose} buttonHeight="sm" />
      </CWModalFooter>
    </div>
  );
};
