import React from 'react';
import { Link } from 'react-router-dom';

import { S3_ASSET_BUCKET_CDN } from '@hicommonwealth/shared';
import { APIOrderDirection } from 'helpers/constants';
import { Avatar } from 'views/components/Avatar';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from 'views/components/component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';

import './ReferralTable.scss';

const fakeData = [
  {
    user: {
      name: 'cambell',
      avatarUrl: `https://${S3_ASSET_BUCKET_CDN}/794bb7a3-17d7-407a-b52e-2987501221b5.png`,
      userId: '128606',
      address: 'address1',
    },
    earnings: '5.3',
  },
  {
    user: {
      name: 'adam',
      avatarUrl: `https://${S3_ASSET_BUCKET_CDN}/0847e7f5-4d96-4406-8f30-c3082fa2f27c.png`,
      userId: '135099',
      address: 'address2',
    },
    earnings: '1.9',
  },
  {
    user: {
      name: 'mike',
      avatarUrl: `https://${S3_ASSET_BUCKET_CDN}/181e25ad-ce08-427d-8d3a-d290af3be44b.png`,
      userId: '158139',
      address: 'address3',
    },
    earnings: '0.1',
  },
];

const columns: CWTableColumnInfo[] = [
  {
    key: 'member',
    header: 'Member',
    numeric: false,
    sortable: true,
  },

  {
    key: 'earnings',
    header: 'Earnings',
    numeric: true,
    sortable: true,
  },
];

export const ReferralTable = () => {
  const tableState = useCWTableState({
    columns,
    initialSortColumn: 'earnings',
    initialSortDirection: APIOrderDirection.Desc,
  });

  return (
    <>
      <div className="ReferralTable">
        {fakeData.length > 0 ? (
          <CWTable
            columnInfo={tableState.columns}
            sortingState={tableState.sorting}
            setSortingState={tableState.setSorting}
            rowData={fakeData.map((item) => ({
              ...item,
              member: {
                sortValue: item.user.name.toLowerCase(),
                customElement: (
                  <div className="table-cell">
                    <Link
                      to={`/profile/id/${item.user.userId}`}
                      className="user-info"
                    >
                      <Avatar
                        url={item.user.avatarUrl ?? ''}
                        size={24}
                        address={+item.user.address}
                      />
                      <p>{item.user.name}</p>
                    </Link>
                  </div>
                ),
              },
              earnings: {
                sortValue: item.earnings,
                customElement: (
                  <div className="table-cell text-right">
                    USD {item.earnings}
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
