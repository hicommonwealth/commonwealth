import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from 'views/components/component_kit/new_designs/CWTable/CWTable';
import FormattedDisplayNumber from 'views/components/FormattedDisplayNumber/FormattedDisplayNumber';
import { FullUser } from 'views/components/user/fullUser';
import './TopHolders.scss';

// Mock data for top holders
const mockTopHolders = [
  {
    address: '0x421',
    userId: 1,
    communityId: 'ethereum',
    name: 'Username',
    tokens: 21312312,
    percentage: 21,
    role: 'Member',
    tier: 3,
  },
  {
    address: '0x421',
    userId: 2,
    communityId: 'ethereum',
    name: 'Username',
    tokens: 1231231,
    percentage: 3.5,
    role: 'Member',
    tier: 3,
  },
  {
    address: '0x421',
    userId: 3,
    communityId: 'ethereum',
    name: 'Username',
    tokens: 12321321,
    percentage: 3.5,
    role: 'Member',
    tier: 3,
  },
  {
    address: '0x421',
    userId: 4,
    communityId: 'ethereum',
    name: 'Username',
    tokens: 12321321,
    percentage: 3.5,
    role: 'Member',
    tier: 3,
  },
  {
    address: '0x421',
    userId: 5,
    communityId: 'ethereum',
    name: 'Username',
    tokens: 12321321,
    percentage: 3.5,
    role: 'Member',
    tier: 3,
  },
  {
    address: '0x421',
    userId: 6,
    communityId: 'ethereum',
    name: 'Username',
    tokens: 12321321,
    percentage: 3.5,
    role: 'Member',
    tier: 3,
  },
];

const TopHolders = () => {
  const navigate = useCommonNavigate();

  // Hardcode isWindowSmallInclusive to false for now to prevent resize issues
  const isWindowSmallInclusive = false;

  const columnInfo: CWTableColumnInfo[] = [
    {
      key: 'user',
      header: 'Username',
      numeric: false,
      sortable: true,
    },
    {
      key: 'tokens',
      header: 'Tokens',
      numeric: true,
      sortable: true,
    },
    {
      key: 'percentDisplay',
      header: '% Held',
      numeric: true,
      sortable: true,
      hasCustomSortValue: true,
    },
  ];

  // Use a memoized date for all rows to reduce re-renders
  const lastActiveDate = useState(() => new Date().toISOString())[0];

  // Transform mock data to the format expected by CWTable
  const rowData = mockTopHolders.map((holder) => {
    return {
      user: {
        customElement: (
          <FullUser
            userAddress={holder.address}
            userCommunityId={holder.communityId}
            profile={{
              address: holder.address,
              name: holder.name,
              userId: holder.userId,
              tier: holder.tier,
              lastActive: lastActiveDate,
              avatarUrl: '',
            }}
            shouldShowPopover
            shouldShowRole
            shouldShowAddressWithDisplayName={!isWindowSmallInclusive}
            className="top-holder-user"
            avatarSize={24}
          />
        ),
      },
      tokens: {
        customElement: (
          <div className="tokens-cell">
            <FormattedDisplayNumber
              value={holder.tokens}
              options={{
                decimals: 1,
                useShortSuffixes: true,
              }}
              tooltipContent={holder.tokens.toLocaleString()}
            />
          </div>
        ),
        sortValue: holder.tokens,
      },
      percentDisplay: {
        customElement: <div className="percent-cell">{holder.percentage}%</div>,
        sortValue: holder.percentage,
      },
    };
  });

  return (
    <div className="TopHolders">
      <div className="heading-container">
        <CWText type="h3">Top Holders</CWText>
        <div
          className="see-all-link"
          onClick={() => navigate('/members?tab=all-members')}
        >
          <div className="link-right">
            <CWText className="link">See all top holders</CWText>
            <CWIcon iconName="arrowRightPhosphor" className="blue-icon" />
          </div>
        </div>
      </div>
      <div className="holders-table">
        <CWTable columnInfo={columnInfo} rowData={rowData} />
      </div>
    </div>
  );
};

export default TopHolders;
