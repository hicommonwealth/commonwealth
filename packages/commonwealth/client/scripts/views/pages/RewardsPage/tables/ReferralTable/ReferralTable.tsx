import React from 'react';
import { Link } from 'react-router-dom';
import { fromWei } from 'web3-utils';

import { APIOrderDirection } from 'helpers/constants';
import { Avatar } from 'views/components/Avatar';
import { CWText } from 'views/components/component_kit/cw_text';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { useCWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';
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
          <CWTable
            columnInfo={tableState.columns}
            sortingState={tableState.sorting}
            setSortingState={tableState.setSorting}
            rowData={referrals.map((item, index) => ({
              ...item,
              rank: {
                sortValue: index + 1,
                customElement: <div className="table-cell">{index + 1}</div>,
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
                  <div className="table-cell">{item.referee_address}</div>
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
            }))}
          />
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
