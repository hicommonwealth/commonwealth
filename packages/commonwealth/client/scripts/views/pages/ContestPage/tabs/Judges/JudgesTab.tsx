import React, { useState } from 'react';
import { useGetMembersQuery } from 'state/api/communities';
import { useDebounce } from 'usehooks-ts';
import Permissions from 'utils/Permissions';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { User } from 'views/components/user/user';
import { ManageOnchainModal } from 'views/pages/CommunityGroupsAndMembers/Members/MembersSection/ManageOnchainModal';
import { AddressInfo } from 'views/pages/CommunityGroupsAndMembers/Members/MembersSection/MembersSection';
import { Contest } from 'views/pages/CommunityManagement/Contests/ContestsList';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';
import { isContestActive } from 'views/pages/CommunityManagement/Contests/utils';

import './JudgesTab.scss';

interface JudgesTabProps {
  contestAddress: string;
  judges: string[];
}

const JudgesTab = ({ contestAddress, judges }: JudgesTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [selectedAddressInfo, setSelectedAddressInfo] = useState<
    AddressInfo[] | undefined
  >(undefined);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [optimisticJudges, setOptimisticJudges] = useState<string[]>(judges);
  const debouncedSearchTerm = useDebounce<string>(searchTerm, 300);

  const { getContestByAddress } = useCommunityContests();
  const contest = getContestByAddress(contestAddress);

  const communityId = contest?.community_id || '';

  const isAdmin = Permissions.isCommunityAdmin() || Permissions.isSiteAdmin();
  const contestIsActive = contest
    ? isContestActive({
        contest: contest as unknown as Contest,
      })
    : false;

  const { data: members, isLoading } = useGetMembersQuery({
    community_id: communityId,
    allowedAddresses: optimisticJudges.join(','),
    apiEnabled: optimisticJudges.length > 0 && !!communityId,
    memberships: 'allow-specified-addresses',
  });

  const { data: searchResults, isLoading: isSearchLoading } =
    useGetMembersQuery({
      community_id: communityId,
      search: debouncedSearchTerm,
      limit: 5,
      apiEnabled:
        !!communityId && debouncedSearchTerm.length > 2 && isSearchVisible,
      searchByNameAndAddress: true,
    });

  const judgeList = (members?.pages[0]?.results || [])
    .filter((member) => optimisticJudges.includes(member.addresses[0]?.address))
    .map((member) => {
      const address = member.addresses[0]?.address || '';
      return {
        user: (
          <User
            shouldShowAddressWithDisplayName={true}
            userAddress={address}
            userCommunityId={communityId}
            shouldLinkProfile={true}
            shouldShowRole={false}
            avatarSize={24}
          />
        ),
        key: address,
      };
    });

  const filteredSearchResults =
    searchResults?.pages[0]?.results?.filter(
      (member) => !optimisticJudges.includes(member.addresses[0].address),
    ) || [];

  const searchList = filteredSearchResults.map((member) => {
    const address = member.addresses[0]?.address || '';
    const addressInfo: AddressInfo[] = member.addresses.map((addr) => ({
      id: addr.id || 0,
      community_id: communityId,
      address: addr.address,
      stake_balance: 0,
      role: 'member',
      referred_by: null,
    }));
    return {
      user: (
        <User
          shouldShowAddressWithDisplayName={true}
          userAddress={address}
          userCommunityId={communityId}
          shouldLinkProfile={true}
          shouldShowRole={false}
          avatarSize={24}
        />
      ),
      action: (
        <CWButton
          label="Add as judge"
          buttonType="secondary"
          buttonHeight="sm"
          onClick={() => {
            setSelectedAddressInfo(addressInfo);
            setIsRoleModalOpen(true);
          }}
        />
      ),
      key: address,
    };
  });

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    // Clear search when hiding
    if (isSearchVisible) {
      setSearchTerm('');
    }
  };

  if (isLoading) {
    return (
      <div className="JudgesTab">
        <CWCard>
          <div className="loading-container">
            <CWCircleMultiplySpinner />
          </div>
        </CWCard>
      </div>
    );
  }

  if (!judges.length) {
    return (
      <div className="JudgesTab">
        <CWCard>
          <div className="empty-state">
            <CWText type="h3">No Judges</CWText>
            <CWText type="b1">
              This contest does not have any judges assigned yet.
            </CWText>
          </div>
        </CWCard>
      </div>
    );
  }

  return (
    <div className="JudgesTab">
      <div className="filter-section">
        <CWText type="h3" fontWeight="semiBold">
          Judges
        </CWText>
        {isAdmin && contestIsActive && (
          <CWButton
            label="Add judges"
            iconLeft="plus"
            onClick={toggleSearch}
            buttonType="primary"
          />
        )}
      </div>

      {isSearchVisible && (
        <div className="search-section">
          <div className="search-container">
            <CWTextInput
              fullWidth
              size="large"
              placeholder="Search members by name or address"
              iconLeft={<CWIcon iconName="search" />}
              onInput={(e) => setSearchTerm(e.target.value)}
              value={searchTerm}
              autoFocus
            />
          </div>

          <div className="search-results">
            {searchTerm.length > 0 && searchTerm.length < 3 ? (
              <div className="no-results">
                <CWText>Search term must be at least 3 characters</CWText>
              </div>
            ) : debouncedSearchTerm.length > 2 ? (
              isSearchLoading ? (
                <div className="loading-container">
                  <CWCircleMultiplySpinner />
                </div>
              ) : searchList.length > 0 ? (
                <div className="judge-list">
                  {searchList.map((item) => (
                    <div className="judge-list-row" key={item.key}>
                      <div className="judge-list-user">{item.user}</div>
                      <div className="judge-list-action">{item.action}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-results">
                  <CWText>No matching members found</CWText>
                </div>
              )
            ) : null}
          </div>
        </div>
      )}

      <CWText type="b2">Active judges</CWText>
      <div className="judge-list">
        {judgeList.map((item) => (
          <div className="judge-list-row" key={item.key}>
            <div className="judge-list-user">{item.user}</div>
          </div>
        ))}
      </div>

      <CWModal
        size="small"
        content={
          <ManageOnchainModal
            onClose={() => {
              setIsRoleModalOpen(false);
            }}
            Addresses={selectedAddressInfo}
            refetch={() => {
              if (selectedAddressInfo && selectedAddressInfo.length > 0) {
                const newAddresses = selectedAddressInfo
                  .map((info: AddressInfo) => info.address)
                  .filter((addr: string) => !optimisticJudges.includes(addr));
                if (newAddresses.length > 0) {
                  setOptimisticJudges((prev) => [...prev, ...newAddresses]);
                }
              }
              setIsRoleModalOpen(false);
              setSearchTerm('');
            }}
            chainId={communityId}
            forceJudgeTab
            contestAddress={contestAddress}
          />
        }
        onClose={() => {
          setIsRoleModalOpen(false);
        }}
        open={isRoleModalOpen}
      />
    </div>
  );
};

export default JudgesTab;
