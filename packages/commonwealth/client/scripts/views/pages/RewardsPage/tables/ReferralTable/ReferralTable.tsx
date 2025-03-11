import React from 'react';
import { Link } from 'react-router-dom';
import { fromWei } from 'web3-utils';

import { formatAddressShort } from 'helpers';
import { APIOrderDirection } from 'helpers/constants';
import { Avatar } from 'views/components/Avatar';
import { CWCommunityAvatar } from 'views/components/component_kit/cw_community_avatar';
import { CWText } from 'views/components/component_kit/cw_text';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { useCWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { Referral } from '../../types';
import { columns } from './columns';

import './ReferralTable.scss';

interface ReferralTableProps {
  referrals?: Referral[];
  isLoading?: boolean;
}

export const ReferralTable = ({ referrals, isLoading }: ReferralTableProps) => {
  const tableState = useCWTableState({
    columns,
    initialSortColumn: 'earnings',
    initialSortDirection: APIOrderDirection.Desc,
  });

  return (
    <>
      <div className="ReferralTable">
        {isLoading ? (
          <div className="loading-state">
            <CWCircleMultiplySpinner />
          </div>
        ) : referrals && referrals.length > 0 ? (
          <div className="table-wrapper">
            <CWTable
              columnInfo={tableState.columns}
              sortingState={tableState.sorting}
              setSortingState={tableState.setSorting}
              rowData={referrals.map((item, index) => {
                const namespaceAddress =
                  typeof item.namespace_address === 'string'
                    ? item.namespace_address
                    : null;

                return {
                  ...item,
                  rank: {
                    sortValue: index + 1,
                    customElement: (
                      <div className="table-cell">{index + 1}</div>
                    ),
                  },
                  username: {
                    sortValue: item.referee_profile?.name?.toLowerCase(),
                    customElement: (
                      <div className="table-cell">
                        <Link
                          to={`/profile/id/${item.referee_user_id}`}
                          className="user-info"
                        >
                          <Avatar
                            url={item.referee_profile?.avatar_url ?? ''}
                            size={24}
                            address={+item.referee_address}
                          />
                          <p>{item.referee_profile?.name}</p>
                        </Link>
                      </div>
                    ),
                  },
                  address: {
                    sortValue: item.referee_address,
                    customElement: (
                      <div className="table-cell">
                        {withTooltip(
                          formatAddressShort(item.referee_address, 6, 4),
                          item.referee_address,
                          true,
                        )}
                      </div>
                    ),
                  },
                  community: {
                    sortValue: item.community_name || '',
                    customElement: item.community_name ? (
                      <div className="table-cell community-cell">
                        <Link
                          to={`/${item.community_id}`}
                          className="community-info"
                        >
                          <CWCommunityAvatar
                            community={{
                              id: item.community_id || '',
                              name: item.community_name || '',
                              iconUrl: item.community_icon_url || '',
                            }}
                            size="medium"
                          />
                          <p>{item.community_name}</p>
                        </Link>
                      </div>
                    ) : (
                      '-'
                    ),
                  },
                  namespace: {
                    sortValue: namespaceAddress || '',
                    customElement: namespaceAddress ? (
                      <div className="table-cell namespace-cell">
                        {withTooltip(
                          formatAddressShort(namespaceAddress || '', 6, 4),
                          namespaceAddress || '',
                          true,
                        )}
                      </div>
                    ) : (
                      '-'
                    ),
                  },
                  earnings: {
                    sortValue: Number(item.referrer_received_eth_amount),
                    customElement: (
                      <div className="table-cell text-right">
                        ETH{' '}
                        {Number(
                          fromWei(item.referrer_received_eth_amount, 'ether'),
                        )}
                      </div>
                    ),
                  },
                };
              })}
            />
          </div>
        ) : (
          <div className="empty-state">
            <CWText className="empty-state-text">
              You currently have no referrals.
            </CWText>
            <CWText className="empty-state-text">
              Refer your friends to earn rewards.
            </CWText>
          </div>
        )}
      </div>
    </>
  );
};
