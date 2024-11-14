import { Role } from '@hicommonwealth/shared';
import React from 'react';
import { Link } from 'react-router-dom';
import Permissions from 'utils/Permissions';
import { Avatar } from 'views/components/Avatar';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { CWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import './MembersSection.scss';

export type Member = {
  userId: number;
  avatarUrl?: string | null;
  name: string;
  role: Role;
  groups: string[];
  stakeBalance?: string;
  lastActive?: string;
  address?: string;
};

type MembersSectionProps = {
  filteredMembers: Member[];
  onLoadMoreMembers?: () => unknown;
  isLoadingMoreMembers?: boolean;
  tableState: CWTableState;
  selectedAccounts?: string[];
  handleCheckboxChange?: (address: string) => void;
  extraColumns?: (member: Member) => object;
};

const MembersSection = ({
  filteredMembers,
  onLoadMoreMembers,
  isLoadingMoreMembers,
  tableState,
  selectedAccounts,
  handleCheckboxChange,
  extraColumns,
}: MembersSectionProps) => {
  return (
    <div className="MembersSection">
      <CWTable
        columnInfo={tableState.columns}
        sortingState={tableState.sorting}
        setSortingState={tableState.setSorting}
        rowData={filteredMembers.map((member) => ({
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
                {member.role === Permissions.ROLES.ADMIN && (
                  <CWTag label="Admin" type="referendum" />
                )}
                {member.role === Permissions.ROLES.MODERATOR && (
                  <CWTag label="Moderator" type="referendum" />
                )}
              </div>
            ),
          },
          groups: {
            sortValue: member.groups
              .sort((a, b) => a.localeCompare(b))
              .join(' ')
              .toLowerCase(),
            customElement: (
              <div className="table-cell">
                {member.groups.map((group, index) => (
                  <CWTag key={index} label={group} type="referendum" />
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
          // @ts-expect-error <StrictNullChecks/>
          ...extraColumns(member),
        }))}
        onScrollEnd={onLoadMoreMembers}
        isLoadingMoreRows={isLoadingMoreMembers}
      />
    </div>
  );
};

export default MembersSection;
