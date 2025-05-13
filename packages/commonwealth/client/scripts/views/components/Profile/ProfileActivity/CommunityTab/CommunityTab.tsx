import React from 'react';

import { useCommonNavigate } from 'navigation/helpers';
import { useFetchCustomDomainQuery } from 'state/api/configuration';
import useUserStore from 'state/ui/user';
import { CWText } from '../../../component_kit/cw_text';
import { CWTable } from '../../../component_kit/new_designs/CWTable';
import './CommunityTab.scss';

export const CommunityTab = () => {
  const navigate = useCommonNavigate();
  const user = useUserStore();
  const { data: domain } = useFetchCustomDomainQuery();

  const columns = [
    {
      key: 'name',
      header: 'Community',
      numeric: false,
      sortable: true,
    },
    {
      key: 'members',
      header: 'Members',
      numeric: true,
      sortable: true,
    },
  ];

  const rowData = user.communities.map((community) => ({
    name: community.name,
    members: '0',
    avatars: {
      name: {
        avatarUrl: community.iconUrl,
        address: null,
      },
    },
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
