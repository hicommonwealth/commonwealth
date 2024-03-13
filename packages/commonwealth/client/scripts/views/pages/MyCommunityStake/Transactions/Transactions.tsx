import { formatAddressShort } from 'helpers';
import React, { useEffect, useState } from 'react';
import TimeAgo from 'react-timeago';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import CommunityInfo from '../common/CommunityInfo';
import { transactionHistoryData } from '../common/sampleData'; // TODO: get data from API
import { FilterOptions } from '../types';
import './Transactions.scss';
import { CWIcon } from '/views/components/component_kit/cw_icons/cw_icon';
import { CWTable } from '/views/components/component_kit/new_designs/CWTable';

const columnInfo = [
  {
    key: 'community',
    header: 'Community',
    numeric: false,
    sortable: true,
    hasCustomSortValue: true,
  },
  {
    key: 'address',
    header: 'Address',
    numeric: false,
    sortable: true,
    hasCustomSortValue: true,
  },
  {
    key: 'action',
    header: 'Action',
    numeric: true,
    sortable: true,
  },
  {
    key: 'stake',
    header: 'Stake',
    numeric: true,
    sortable: true,
  },
  {
    key: 'avgPrice',
    header: 'Avg. price',
    numeric: true,
    sortable: true,
  },
  {
    key: 'totalPrice',
    header: 'Total price',
    numeric: true,
    sortable: true,
  },
  {
    key: 'timestamp',
    header: 'Timestamp',
    numeric: true,
    sortable: true,
    hasCustomSortValue: true,
  },
  {
    key: 'etherscanLink',
    header: () => <CWIcon iconName="etherscan" iconSize="regular" />,
    numeric: false,
    sortable: false,
  },
];

type TransactionsProps = {
  filterOptions: FilterOptions;
};

const Transactions = ({ filterOptions }: TransactionsProps) => {
  const [filteredTransactionHistoryData, setFilteredTransactionHistoryData] =
    useState(transactionHistoryData);

  useEffect(() => {
    let tempFilteredData = [...transactionHistoryData];

    // check if community name and symbol contains 'searchText'
    if (filterOptions.searchText) {
      tempFilteredData = tempFilteredData.filter((tx) =>
        (tx.community.symbol + tx.community.name)
          .toLowerCase()
          .includes(filterOptions.searchText.toLowerCase()),
      );
    }

    setFilteredTransactionHistoryData(tempFilteredData);
  }, [filterOptions.searchText]);

  return (
    <section className="Transactions">
      <CWTable
        columnInfo={columnInfo}
        rowData={filteredTransactionHistoryData.map((tx) => ({
          ...tx,
          community: {
            sortValue: tx.community.name.toLowerCase(),
            customElement: (
              <CommunityInfo
                symbol={tx.community.symbol}
                iconUrl={tx.community.iconUrl}
                name={tx.community.name}
                communityId={tx.community.id}
              />
            ),
          },
          address: {
            sortValue: tx.address,
            customElement: (
              <CWTooltip
                content={tx.address}
                renderTrigger={(handleInteraction) => (
                  <span
                    className="cursor-pointer"
                    onMouseEnter={handleInteraction}
                    onMouseLeave={handleInteraction}
                  >
                    {formatAddressShort(tx.address, 5, 5)}
                  </span>
                )}
              />
            ),
          },
          timestamp: {
            sortValue: tx.timestamp,
            customElement: (
              <CWTooltip
                content={new Date(tx.timestamp).toLocaleString()}
                renderTrigger={(handleInteraction) => (
                  <span
                    className="timestamp"
                    onMouseEnter={handleInteraction}
                    onMouseLeave={handleInteraction}
                  >
                    <TimeAgo date={tx.timestamp} title="" />
                  </span>
                )}
              />
            ),
          },
          etherscanLink: {
            customElement: (
              <a
                target="_blank"
                rel="noreferrer"
                href={tx.etherscanLink}
                onClick={(e) => e.stopPropagation()}
              >
                <CWIcon iconName="externalLink" className="etherscanLink" />
              </a>
            ),
          },
        }))}
      />
    </section>
  );
};

export { Transactions };
