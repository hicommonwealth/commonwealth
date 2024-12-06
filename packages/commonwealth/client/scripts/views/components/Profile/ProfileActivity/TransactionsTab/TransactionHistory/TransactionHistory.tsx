import { formatAddressShort } from 'helpers';
import { APIOrderDirection } from 'helpers/constants';
import { getRelativeTimestamp } from 'helpers/dates';
import React from 'react';
import CommunityInfo from 'views/components/component_kit/CommunityInfo';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from 'views/components/component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { TransactionsProps } from '../../types';
import './TransactionHistory.scss';

const columns: CWTableColumnInfo[] = [
  {
    key: 'transactionType',
    header: 'Transaction Type',
    numeric: false,
    sortable: true,
  },
  {
    key: 'community',
    header: 'Community',
    numeric: false,
    sortable: true,
    hasCustomSortValue: true,
  },
  {
    key: 'assets',
    header: 'Assets',
    numeric: false,
    sortable: true,
    hasCustomSortValue: true,
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

const TransactionHistory = ({ transactions }: TransactionsProps) => {
  const tableState = useCWTableState({
    columns,
    initialSortColumn: 'timestamp',
    initialSortDirection: APIOrderDirection.Desc,
  });

  return (
    <section className="Transactions">
      <CWTable
        columnInfo={tableState.columns}
        sortingState={tableState.sorting}
        setSortingState={tableState.setSorting}
        rowData={transactions.map((tx) => ({
          ...tx,
          community: {
            sortValue: tx?.community?.name?.toLowerCase(),
            customElement: (
              <CommunityInfo
                symbol={tx.community.default_symbol || ''}
                iconUrl={tx.community.icon_url || ''}
                name={tx.community.name}
                communityId={tx.community.id}
              />
            ),
          },
          transactionType: {
            customElement: (
              <CWText type="b1" className="capitalize">
                {tx.transaction_category}
              </CWText>
            ),
          },
          assets: {
            sortValue: tx.totalPrice,
            customElement: (
              <div className="asset-value">
                <CWText type="b1" fontWeight="semiBold">
                  {tx.transaction_type} /{' '}
                  {tx.transaction_category === 'stake'
                    ? tx.amount
                    : // TODO: fix display value for this
                      tx.amount}{' '}
                  {tx.transaction_category === 'stake' ? 'stake' : 'tokens'}
                </CWText>
                <CWText type="caption">{tx.totalPrice}</CWText>
              </div>
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
                    {getRelativeTimestamp(tx.timestamp)}
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

export { TransactionHistory };
