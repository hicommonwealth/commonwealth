import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import { useGetTopHoldersQuery } from 'state/api/communities/getTopHolders';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from 'views/components/component_kit/new_designs/CWTable/CWTable';
import FormattedDisplayNumber from 'views/components/FormattedDisplayNumber/FormattedDisplayNumber';
import { FullUser } from 'views/components/user/fullUser';
import './TopHolders.scss';

const TopHolders = () => {
  const navigate = useCommonNavigate();
  const communityId = app.activeChainId() || '';

  const { data: topHolders, isLoading } = useGetTopHoldersQuery({
    community_id: communityId,
    limit: 10,
  });

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

  const rowData = topHolders?.results.map((holder) => {
    const name = holder.name || '';
    const percentage = 0; // TODO: Calculate percentage total supply / tokens ?
    return {
      user: {
        customElement: (
          <FullUser
            userAddress={holder.address}
            userCommunityId={communityId}
            profile={{
              address: holder.address,
              name: name.length > 8 ? name.substring(0, 8) + '...' : name,
              userId: holder.user_id,
              tier: holder.tier,
              lastActive: new Date().toISOString(),
              avatarUrl: holder.avatar_url || '',
            }}
            shouldShowPopover
            shouldShowRole
            shouldShowAddressWithDisplayName={true}
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
        customElement: <div className="percent-cell">{percentage}%</div>,
        sortValue: percentage,
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
        {isLoading ? (
          <CWText>Loading...</CWText>
        ) : (
          <CWTable columnInfo={columnInfo} rowData={rowData!} />
        )}
      </div>
    </div>
  );
};

export default TopHolders;
