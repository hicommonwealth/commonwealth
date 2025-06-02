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
import useNominateJudgesMutation from 'client/scripts/state/api/contests/nominateJudges';
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
import { useFlag } from 'hooks/useFlag';
import React, { useMemo, useState } from 'react';
import app from 'state';
import { AddressItem, CheckboxOption, RadioOption } from './AddressItem';
import './ManageOnchainModal.scss';
import { AddressInfo } from './MembersSection';

type ManageOnchainModalProps = {
  onClose: () => void;
  Addresses: AddressInfo[] | undefined;
  refetch?: () => void;
  chainId: string;
  communityNamespace?: boolean;
  forceJudgeTab?: boolean;
  contestAddress?: string;
};

type ContestOption = {
  label: string;
  value: string;
};

export const ManageOnchainModal = ({
  onClose,
  Addresses,
  refetch,
  chainId,
  communityNamespace,
  forceJudgeTab = false,
  contestAddress,
}: ManageOnchainModalProps) => {
  const judgeContestEnabled = useFlag('judgeContest');

  const [userRole, setUserRole] = useState(Addresses);
  const [judgeRoles, setJudgeRoles] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const { contestsData, isContestDataLoading } = useCommunityContests({
    shouldPolling: false,
    fetchAll: false,
  });

  const contestOptions = useMemo<ContestOption[]>(() => {
    const allOptions: ContestOption[] = [];
    if (contestsData?.active && contestsData.active.length > 0) {
      contestsData.active.forEach((contest) => {
        if (contest.contests && contest.namespace_judge_token_id) {
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

  const initialSelectedContest = useMemo(() => {
    if (contestAddress && contestOptions.length > 0) {
      const found = contestOptions.find((c) => c.value === contestAddress);
      if (found) return found;
    }
    return null;
  }, [contestAddress, contestOptions]);

  const initialActiveTab = forceJudgeTab ? 'judgedContest' : 'adminId';

  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [selectedContest, setSelectedContest] = useState<ContestOption | null>(
    initialSelectedContest,
  );

  const { mutateAsync: updateRole } = useUpdateRoleMutation();
  const { mutateAsync: nominateJudges } = useNominateJudgesMutation();

  const userData = useUserStore();
  const mintAdminTokenMutation = useMintAdminTokenMutation();

  const { data: community } = useGetCommunityByIdQuery({
    id: chainId,
    enabled: !!chainId,
    includeNodeInfo: true,
  });

  const selectedContestData = useMemo(() => {
    if (!selectedContest?.value || !contestsData?.active) return null;

    return contestsData.active.find(
      (contest) => contest.contest_address === selectedContest.value,
    );
  }, [selectedContest, contestsData]);

  const hasActiveContests = contestOptions.length > 0;

  const hasRoleChanges = useMemo(() => {
    if (!userRole || !Addresses) return false;

    return userRole.some((user, index) => user.role !== Addresses[index]?.role);
  }, [userRole, Addresses]);

  const hasJudgeChanges = useMemo(() => {
    if (!selectedContestData || Object.keys(judgeRoles).length === 0)
      return false;

    return Object.entries(judgeRoles).some(([address, isJudge]) => {
      const isAlreadyJudge =
        selectedContestData.namespace_judges?.includes(address) || false;
      return isJudge !== isAlreadyJudge;
    });
  }, [judgeRoles, selectedContestData]);

  const handleRoleChange = (id: number, newRole: string) => {
    setUserRole((prevData) =>
      (prevData || []).map((user) => {
        if (user.id === id && user.role !== newRole) {
          return { ...user, role: newRole };
        }
        return user;
      }),
    );
  };

  const handleJudgeRoleChange = (id: number, address: string) => {
    setJudgeRoles((prev) => {
      const isCurrentlyChecked = prev[address];
      const newState = { ...prev, [address]: !isCurrentlyChecked };
      return newState;
    });
  };

  const updateRolesOnServer = async () => {
    if (!hasRoleChanges) return;
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

      refetch?.();
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
              namespace: community?.namespace || '',
              walletAddress,
              adminAddress: update.address,
              chainRpc: community?.ChainNode?.url || '',
              ethChainId: community?.ChainNode?.eth_chain_id || 0,
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

      // Here you would add logic to update judges for the selected contest
      if (selectedContest && Object.keys(judgeRoles).length > 0) {
        // API call to update judges would go here
        console.log('Updating judges:', judgeRoles);
      }
    } catch (err) {
      console.error(err);
      notifyError('Minting failed, permissions were not updated.');
    } finally {
      onClose();
    }
  };

  const handleNominateJudge = async () => {
    try {
      setLoading(true);

      if (!selectedContest || !selectedContestData) {
        throw new Error('No contest selected');
      }

      const walletAddress = userData.activeAccount?.address;
      if (!walletAddress) {
        throw new Error('Wallet Address Not Found');
      }

      const judgeTokenId = selectedContestData.namespace_judge_token_id;
      if (!judgeTokenId) {
        throw new Error('Judge token ID not found for this contest');
      }

      const selectedJudges = Object.entries(judgeRoles)
        .filter(([address, isSelected]) => {
          const isAlreadyJudge =
            selectedContestData.namespace_judges?.includes(address) || false;
          return isSelected && !isAlreadyJudge;
        })
        .map(([address]) => address);

      if (selectedJudges.length === 0) {
        throw new Error('No new judges selected');
      }

      await nominateJudges({
        namespace: community?.namespace || '',
        judges: selectedJudges,
        judgeId: judgeTokenId,
        walletAddress,
        ethChainId: community?.ChainNode?.eth_chain_id || 0,
        chainRpc: community?.ChainNode?.url || '',
      });

      notifySuccess('Judges nominated successfully');

      refetch?.();
    } catch (err) {
      console.error(err);
      notifyError(err.message || 'Failed to nominate judges');
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const handleContestSelect = (option: ContestOption) => {
    setSelectedContest(option);
  };

  const getRadioOptions = (address: AddressInfo): RadioOption[] => {
    return [
      { label: 'Admin', value: 'admin', checked: address.role === 'admin' },
      { label: 'Member', value: 'member', checked: address.role === 'member' },
    ];
  };

  const getJudgeCheckboxOptions = (address: AddressInfo): CheckboxOption[] => {
    const isAlreadyJudge = !!selectedContestData?.namespace_judges?.includes(
      address.address,
    );

    return [
      {
        label: isAlreadyJudge ? 'Active Judge' : 'Judge',
        value: 'judge',
        checked: isAlreadyJudge || !!judgeRoles[address.address],
        disabled: isAlreadyJudge,
      },
    ];
  };

  const renderFooterButtons = () => {
    if (activeTab === 'adminId') {
      return (
        <>
          <CWButton label="Close" onClick={onClose} buttonHeight="sm" />
          <CWButton
            label={communityNamespace ? 'Confirm & Mint' : 'Confirm'}
            buttonType="secondary"
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={handleUpdate}
            buttonHeight="sm"
            disabled={loading || !hasRoleChanges}
          />
        </>
      );
    } else if (activeTab === 'judgedContest') {
      return (
        <>
          <CWButton label="Close" onClick={onClose} buttonHeight="sm" />
          <CWButton
            label="Nominate Judge"
            buttonType="secondary"
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={handleNominateJudge}
            buttonHeight="sm"
            disabled={loading || !hasJudgeChanges || !selectedContest}
          />
        </>
      );
    }
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
            isDisabled={forceJudgeTab}
          />
          {judgeContestEnabled && (
            <CWTab
              label="Judged Contest"
              isSelected={activeTab === 'judgedContest'}
              onClick={() => setActiveTab('judgedContest')}
            />
          )}
        </CWTabsRow>

        {activeTab === 'adminId' && (
          <div className="address-list">
            {userRole?.map((address) => (
              <AddressItem
                key={address.id}
                address={address}
                communityBase={community?.base}
                radioOptions={getRadioOptions(address)}
                onChange={handleRoleChange}
              />
            ))}
          </div>
        )}

        {activeTab === 'judgedContest' && judgeContestEnabled && (
          <div className="judged-contest-content">
            {isContestDataLoading ? (
              <CWText type="b1">Loading contests...</CWText>
            ) : hasActiveContests ? (
              <>
                <CWSelectList
                  label="Select Contest to Judge"
                  options={contestOptions}
                  value={selectedContest}
                  onChange={handleContestSelect}
                  placeholder="Select a contest..."
                  isDisabled={!!contestAddress}
                />

                {selectedContest && (
                  <div className="address-list" style={{ marginTop: '16px' }}>
                    {userRole?.map((address) => (
                      <AddressItem
                        key={address.id}
                        address={address}
                        communityBase={community?.base}
                        checkboxOptions={getJudgeCheckboxOptions(address)}
                        onChange={(id) =>
                          handleJudgeRoleChange(id, address.address)
                        }
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <CWText type="b1">
                No active contests available in this community.
              </CWText>
            )}
          </div>
        )}
      </CWModalBody>
      <CWModalFooter>{renderFooterButtons()}</CWModalFooter>
    </div>
  );
};
