import { Role, WalletId } from '@hicommonwealth/shared';
import useRunOnceOnCondition from 'client/scripts/hooks/useRunOnceOnCondition';
import { formatAddressShort } from 'helpers';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import app from 'state';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { Avatar } from 'views/components/Avatar';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { CWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';
import {
  CustomAddressOption,
  CustomAddressOptionElement,
} from 'views/modals/ManageCommunityStakeModal/StakeExchangeForm/CustomAddressOption';
import { convertAddressToDropdownOption } from 'views/modals/TradeTokenModel/CommonTradeModal/CommonTradeTokenForm/helpers';
import { getFallbackImage } from '../helper';
import { ManageOnchainModal } from './ManageOnchainModal';
import './MembersSection.scss';

export type Group = {
  name: string;
  groupImageUrl: string;
};

export type Member = {
  userId: number;
  avatarUrl?: string | null;
  name: string;
  role: Role;
  groups: Group[];
  stakeBalance?: string;
  lastActive?: string;
  address?: string;
  addresses?: AddressInfo[];
  uniqueAddresses?: string[];
};

export type MemberWithGroups = Omit<Member, 'groups'> & {
  groups: Group[];
};

export type AddressInfo = {
  id: number;
  community_id: string;
  address: string;
  stake_balance: number;
  role: string;
  referred_by: string | null;
  wallet_id?: WalletId;
};

type MembersSectionProps = {
  filteredMembers: Member[];
  onLoadMoreMembers?: () => unknown;
  isLoadingMoreMembers?: boolean;
  tableState: CWTableState;
  selectedAccounts?: string[];
  handleCheckboxChange?: (address: string) => void;
  refetch?: () => void;
  extraColumns?: (member: Member) => object;
  canManagePermissions?: boolean;
};

const MembersSection = ({
  filteredMembers,
  onLoadMoreMembers,
  isLoadingMoreMembers,
  tableState,
  selectedAccounts,
  handleCheckboxChange,
  refetch,
  extraColumns,
  canManagePermissions = false,
}: MembersSectionProps) => {
  const { data: community } = useGetCommunityByIdQuery({
    id: app.activeChainId() || '',
    enabled: !!app.activeChainId(),
    includeGroups: true,
  });

  const chainId = community?.id || app.activeChainId() || '';

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const [selectedUserAddresses, setSelectedUserAddresses] = useState<
    AddressInfo[] | undefined
  >(undefined);

  const [userSelectedAddresses, setUserSelectedAddresses] = useState<
    Record<number, string>
  >({});

  const handleManageOnchainClick = (Addresses: AddressInfo[] | undefined) => {
    setSelectedUserAddresses(Addresses);
    setIsRoleModalOpen(true);
  };

  const removeDuplicateAddresses = (members: Member[]) => {
    return members.map((member) => ({
      ...member,
      addresses: member.addresses
        ? [
            ...new Map(
              member.addresses.map((address) => [address.id, address]),
            ).values(),
          ]
        : [],
    }));
  };
  const filteredMember = removeDuplicateAddresses(filteredMembers);

  useRunOnceOnCondition({
    callback: () => {
      if (!selectedAccounts || !filteredMember) return;
      const newSelected: Record<number, string> = {};
      filteredMember.forEach((member) => {
        const found = (member.uniqueAddresses || []).find((addr) =>
          selectedAccounts.includes(addr),
        );
        if (found) {
          newSelected[member.userId] = found;
        }
      });
      setUserSelectedAddresses(newSelected);
    },
    shouldRun:
      Array.isArray(selectedAccounts) &&
      selectedAccounts.length > 0 &&
      filteredMember.length > 0 &&
      Object.keys(userSelectedAddresses).length === 0,
  });

  return (
    <div className="MembersSection">
      <CWTable
        columnInfo={tableState.columns}
        sortingState={tableState.sorting}
        setSortingState={tableState.setSorting}
        rowData={filteredMember.map((member) => ({
          name: {
            sortValue: member.name + (member.role || ''),
            customElement: (
              <div className="table-cell row">
                {handleCheckboxChange && (
                  <CWCheckbox
                    checked={(selectedAccounts || [])?.includes(
                      userSelectedAddresses[member.userId] || '',
                    )}
                    onChange={() => {
                      let selectedAddress =
                        userSelectedAddresses[member.userId] || '';
                      if (!selectedAddress) {
                        selectedAddress =
                          member?.uniqueAddresses?.[0] || member.address || '';
                        setUserSelectedAddresses((prev) => ({
                          ...prev,
                          [member.userId]: selectedAddress,
                        }));
                      }
                      console.log('selectedAddress => ', selectedAddress);
                      handleCheckboxChange(selectedAddress);
                    }}
                  />
                )}
                <Link to={`/profile/id/${member.userId}`} className="user-info">
                  <Avatar
                    url={member.avatarUrl ?? ''}
                    size={24}
                    address={member.userId}
                  />
                  <p>{member.name}</p>
                </Link>
              </div>
            ),
          },
          groups: {
            sortValue: member.groups
              .map((group) => group.name)
              .sort((a, b) => a.localeCompare(b))
              .join(' ')
              .toLowerCase(),
            customElement: (
              <div className="table-cell">
                {member.groups.map((group, index) => (
                  <div key={index} className="group-item">
                    <span className="group-name">{group.name}</span>
                    <img
                      src={group.groupImageUrl || getFallbackImage()}
                      alt={group.name}
                      className="group-image"
                    />
                  </div>
                ))}
              </div>
            ),
          },
          stakeBalance: {
            sortValue: parseInt(member.stakeBalance || '0', 10),
            customElement: (
              <div className="table-cell text-right">{member.stakeBalance}</div>
            ),
          },
          address: {
            sortValue: member.address?.length || 0,
            customElement: (
              <div className="table-cell">
                {member?.uniqueAddresses?.length === 1 ? (
                  formatAddressShort(member.address || '', 5, 6)
                ) : (
                  <CWSelectList
                    components={{
                      Option: (originalProps) =>
                        CustomAddressOption({
                          originalProps,
                          selectedAddressValue:
                            userSelectedAddresses[member.userId] || '',
                        }),
                    }}
                    formatOptionLabel={(option) => (
                      <CustomAddressOptionElement
                        value={option.value}
                        label={option.label}
                        selectedAddressValue={
                          userSelectedAddresses[member.userId] || ''
                        }
                      />
                    )}
                    placeholder="Select address"
                    isClearable={false}
                    isSearchable={false}
                    options={(member.uniqueAddresses || [])?.map(
                      convertAddressToDropdownOption,
                    )}
                    {...(userSelectedAddresses[member.userId]
                      ? {
                          value: convertAddressToDropdownOption(
                            userSelectedAddresses[member.userId],
                          ),
                        }
                      : {})}
                    onChange={(option) => {
                      if (option?.value) {
                        // if the older value wasnt this
                        // and an other address of this user exists
                        const foundOtherAddressSelected =
                          selectedAccounts?.find(
                            (address) =>
                              address ===
                              (userSelectedAddresses[member.userId] || ''),
                          );
                        const isSameAsOldAddress =
                          (userSelectedAddresses[member.userId] || '') ===
                          option.value;
                        const shouldUpdateCheckbox =
                          foundOtherAddressSelected &&
                          !isSameAsOldAddress &&
                          foundOtherAddressSelected !== option.value;
                        if (shouldUpdateCheckbox) {
                          foundOtherAddressSelected &&
                            handleCheckboxChange?.(foundOtherAddressSelected); // to remove this option
                          handleCheckboxChange?.(option.value);
                        }
                        setUserSelectedAddresses((prev) => ({
                          ...prev,
                          [member.userId]: option.value,
                        }));
                      } else {
                        setUserSelectedAddresses((prev) => {
                          const updated = { ...prev };
                          delete updated[member.userId];
                          return updated;
                        });
                      }
                    }}
                  />
                )}
              </div>
            ),
          },
          ...(canManagePermissions
            ? {
                actions: {
                  customElement: (
                    <CWButton
                      label={
                        community?.namespace
                          ? 'Manage On Chain Role Privileges'
                          : 'Manage Role'
                      }
                      buttonType="secondary"
                      onClick={() =>
                        handleManageOnchainClick(member?.addresses)
                      }
                    />
                  ),
                },
              }
            : {}),
          ...(extraColumns ? extraColumns(member) : () => ({})),
        }))}
        onScrollEnd={onLoadMoreMembers}
        isLoadingMoreRows={isLoadingMoreMembers}
      />
      <CWModal
        size="small"
        content={
          <ManageOnchainModal
            onClose={() => {
              setIsRoleModalOpen(false);
            }}
            Addresses={selectedUserAddresses}
            refetch={refetch}
            chainId={chainId}
            communityNamespace={!!community?.namespace}
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

export default MembersSection;
