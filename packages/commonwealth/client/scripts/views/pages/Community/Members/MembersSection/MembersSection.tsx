import React from 'react';
import Permissions from 'utils/Permissions';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import './MembersSection.scss';

type Member = {
  name: string;
  role: 'admin' | 'moderator' | '';
  groups: string[];
};

type MembersSectionProps = {
  members: Member[];
};

const isGatingEnabled =  process.env.GATING_API_ENABLED || true;

const columns = [
  {
    key: 'name',
    header: 'Name',
    numeric: false,
    sortable: true,
  }
]

isGatingEnabled && columns.push({
  key: 'groups',
  header: 'Groups',
  numeric: false,
  sortable: true,
})

const MembersSection = ({ members }: MembersSectionProps) => {
  return (
    <div className="MembersSection">
      <CWTable
        columnInfo={columns}
        rowData={members.map((member) => ({
          name: (
            <div className="table-cell">
              <CWText type="b2">{member.name}</CWText>
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
              {isGatingEnabled && member.groups.map((group, index) => (
                <CWTag key={index} label={group} type="referendum" />
              ))}
            </div>
          ),
        }))}
      />
    </div>
  );
};

export default MembersSection;
