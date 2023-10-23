import React from 'react';
import Permissions from 'utils/Permissions';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { User } from 'views/components/user/user';
import './MembersSection.scss';

type Member = {
  name: string;
  address: string;
  chain: string;
  role: 'admin' | 'moderator' | '';
  groups: string[];
};

type MembersSectionProps = {
  members: Member[];
  onLoadMoreMembers: () => any;
  isLoadingMoreMembers?: boolean;
};

const columns = [
  {
    key: 'name',
    header: 'Name',
    numeric: false,
    sortable: true,
  },
  {
    key: 'groups',
    header: 'Groups',
    numeric: false,
    sortable: true,
  },
];

const MembersSection = ({
  members,
  onLoadMoreMembers,
  isLoadingMoreMembers,
}: MembersSectionProps) => {
  return (
    <div className="MembersSection">
      <CWTable
        columnInfo={columns}
        rowData={members.map((member) => ({
          name: (
            <div className="table-cell">
              <User
                userAddress={member.address}
                userChainId={member.chain}
                shouldLinkProfile
              />
              {member.role === Permissions.ROLES.ADMIN && (
                <CWTag label="Admin" type="referendum" />
              )}
              {member.role === Permissions.ROLES.MODERATOR && (
                <CWTag label="Moderator" type="referendum" />
              )}
            </div>
          ),
          groups: (
            <div className="table-cell">
              {member.groups.map((group, index) => (
                <CWTag key={index} label={group} type="referendum" />
              ))}
            </div>
          ),
        }))}
        onScrollEnd={onLoadMoreMembers}
        isLoadingMoreRows={isLoadingMoreMembers}
      />
    </div>
  );
};

export default MembersSection;
