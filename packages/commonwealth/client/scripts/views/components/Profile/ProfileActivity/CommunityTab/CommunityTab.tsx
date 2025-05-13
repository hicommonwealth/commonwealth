import React from 'react';

import useUserStore from 'state/ui/user';
import { CWText } from '../../../component_kit/cw_text';
import { CWTable } from '../../../component_kit/new_designs/CWTable';
import { CommunityStake } from './CommunityStake/CommunityStake';
import './CommunityTab.scss';
import { LastActive } from './LastActive/LastActive';

export const CommunityTab = () => {
  const user = useUserStore();

  const columns = [
    {
      key: 'name',
      header: 'Community',
      numeric: false,
      sortable: true,
    },
    {
      key: 'stake',
      header: 'Stake',
      numeric: true,
      sortable: true,
    },
    {
      key: 'lastActive',
      header: 'Last Active',
      numeric: false,
      sortable: true,
    },
  ];

  const rowData = user.communities.map((community) => ({
    name: community.name,
    stake: <CommunityStake communityId={community.id} />,
    avatars: {
      name: {
        avatarUrl: community.iconUrl,
        address: null,
      },
    },
    lastActive: <LastActive communityId={community.id} />,
  }));

  return (
    <div className="CommunityTab">
      {user.communities.length > 0 ? (
        <CWTable columnInfo={columns} rowData={rowData} />
      ) : (
        <CWText>No communities found</CWText>
      )}
    </div>
  );
};
