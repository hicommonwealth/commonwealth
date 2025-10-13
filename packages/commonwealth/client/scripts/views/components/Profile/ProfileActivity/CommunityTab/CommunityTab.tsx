import React from 'react';
import { Link } from 'react-router-dom';
import type { UserCommunities } from 'state/ui/user/user';
import { CWText } from '../../../component_kit/cw_text';
import { CWTable } from '../../../component_kit/new_designs/CWTable';
import { CommunityStake } from './CommunityStake/CommunityStake';
import './CommunityTab.scss';
import { Role } from './Role/Role';

type CommunityTabProps = {
  communities: UserCommunities[];
};

export const CommunityTab = ({ communities }: CommunityTabProps) => {
  const columns = [
    {
      key: 'name',
      header: 'Community',
      numeric: false,
      sortable: true,
    },
    {
      key: 'role',
      header: 'Role',
      numeric: false,
      sortable: true,
    },
    {
      key: 'stake',
      header: 'Stake',
      numeric: true,
      sortable: true,
    },
  ];

  const rowData = communities.map((community) => ({
    name: {
      sortValue: community.name,
      customElement: (
        <div className="table-cell community-cell">
          <Link
            to={`/${community.id}`}
            className="community-info"
          >
            {community.iconUrl && (
              <img 
                src={community.iconUrl} 
                alt={`${community.name} icon`}
                className="community-icon"
              />
            )}
            <CWText>{community.name}</CWText>
          </Link>
        </div>
      ),
    },
    stake: <CommunityStake communityId={community.id} />,
    role: <Role communityId={community.id} />,
  }));

  return (
    <div className="CommunityTab">
      {communities.length > 0 ? (
        <CWTable columnInfo={columns} rowData={rowData} />
      ) : (
        <CWText>No communities found</CWText>
      )}
    </div>
  );
};
