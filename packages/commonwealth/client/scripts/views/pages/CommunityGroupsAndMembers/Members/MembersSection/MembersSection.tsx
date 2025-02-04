import { Role } from '@hicommonwealth/shared';
import { formatAddressShort } from 'client/scripts/helpers';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import { CWModal } from 'client/scripts/views/components/component_kit/new_designs/CWModal';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from 'views/components/Avatar';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { CWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
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
}: MembersSectionProps) => {
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const [selectedUserAddresses, setSelectedUserAddresses] = useState<
    AddressInfo[] | undefined
  >(undefined);

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
              <div className="table-cell">
                {handleCheckboxChange && (
                  <CWCheckbox
                    // @ts-expect-error <StrictNullChecks/>
                    checked={selectedAccounts.includes(member.address)}
                    // @ts-expect-error <StrictNullChecks/>
                    onChange={() => handleCheckboxChange(member.address)}
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
          addresses: {
            sortValue: member.address?.length || 0,
            customElement: (
              <div className="table-cell">
                {member.addresses?.map((address, index) => {
                  return (
                    <div key={index} className="address-item">
                      <CWTag
                        label={formatAddressShort(address.address)}
                        type="address"
                        iconName="ethereum"
                      />
                    </div>
                  );
                })}
              </div>
            ),
          },
          actions: {
            customElement: (
              <CWButton
                label="Manage On Chain Role Privileges"
                buttonType="secondary"
                onClick={() => handleManageOnchainClick(member?.addresses)}
              />
            ),
          },
          // @ts-expect-error <StrictNullChecks/>
          ...extraColumns(member),
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
