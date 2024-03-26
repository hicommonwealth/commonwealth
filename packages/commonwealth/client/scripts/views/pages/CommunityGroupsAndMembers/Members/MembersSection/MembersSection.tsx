import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Permissions from 'utils/Permissions';
import { Avatar } from 'views/components/Avatar';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import './MembersSection.scss';

type Member = {
  id: number;
  avatarUrl: string;
  name: string;
  role: 'admin' | 'moderator' | '';
  groups: string[];
  stakeBalance?: string;
};

type MembersSectionProps = {
  filteredMembers: Member[];
  onLoadMoreMembers: () => any;
  isLoadingMoreMembers?: boolean;
  isStakedCommunity?: boolean;
};

const MembersSection = ({
  filteredMembers,
  onLoadMoreMembers,
  isLoadingMoreMembers,
  isStakedCommunity,
}: MembersSectionProps) => {
  const columns = useMemo(() => {
    const c = [
      {
        key: 'name',
        header: 'Name',
        hasCustomSortValue: true,
        numeric: false,
        sortable: false,
      },
      {
        key: 'groups',
        header: 'Groups',
        hasCustomSortValue: true,
        numeric: false,
        sortable: false,
      },
    ];
    if (isStakedCommunity) {
      c.push({
        key: 'stakeBalance',
        header: 'Stake',
        hasCustomSortValue: true,
        numeric: true,
        sortable: false,
      });
    }
    return c;
  }, [isStakedCommunity]);

  return (
    <div className="MembersSection">
      <CWTable
        columnInfo={columns}
        rowData={filteredMembers.map((member) => ({
          name: {
            sortValue: member.name + (member.role || ''),
            customElement: (
              <div className="table-cell">
                <Link to={`/profile/id/${member.id}`} className="user-info">
                  <Avatar
                    url={member.avatarUrl}
                    size={24}
                    address={member.id}
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
              <div className="table-cell last-column">
                {member.stakeBalance}
              </div>
            ),
          },
        }))}
        onScrollEnd={onLoadMoreMembers}
        isLoadingMoreRows={isLoadingMoreMembers}
      />
    </div>
  );
};

export default MembersSection;
