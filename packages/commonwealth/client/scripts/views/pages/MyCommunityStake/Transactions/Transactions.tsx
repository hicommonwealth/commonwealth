import { formatAddressShort } from 'helpers';
import { getRelativeTimestamp } from 'helpers/dates';
import React from 'react';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import useTransactionHistory, {
  TransactionHistoryProps,
} from '../../../../hooks/useTransactionHistory';
import CommunityInfo from '../common/CommunityInfo';
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

const Transactions = ({
  filterOptions,
  addressFilter,
}: TransactionHistoryProps) => {
  const data = useTransactionHistory({
    filterOptions,
    addressFilter,
  });

  return (
    <section className="Transactions">
      <CWTable
        columnInfo={columnInfo}
        rowData={data.map((tx) => ({
          ...tx,
          community: {
            sortValue: tx.community.name.toLowerCase(),
            customElement: (
              <CommunityInfo
                symbol={tx.community.default_symbol}
                iconUrl={tx.community.icon_url}
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

export { Transactions };
