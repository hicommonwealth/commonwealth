import { WEI_PER_ETHER } from '@hicommonwealth/shared';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { APIOrderDirection } from 'helpers/constants';
import React from 'react';
import CommunityInfo from 'views/components/component_kit/CommunityInfo';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from 'views/components/component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';
import { TransactionsProps } from '../../types';
import './MyTokens.scss';

const columns: CWTableColumnInfo[] = [
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
    key: 'etherscanLink',
    header: () => <CWIcon iconName="etherscan" iconSize="regular" />,
    numeric: false,
    sortable: false,
  },
];

const MyTokens = ({ transactions }: TransactionsProps) => {
  const tableState = useCWTableState({
    columns,
    initialSortColumn: 'voteWeight',
    initialSortDirection: APIOrderDirection.Desc,
  });

  // aggregate transaction per community per address
  const stakes = (() => {
    const accumulatedStakes = {};

    transactions.map((transaction) => {
      const key = (
        transaction.community.id + transaction.address
      ).toLowerCase();
      const action = transaction.transaction_type === 'mint' ? 1 : -1;

      accumulatedStakes[key] = {
        ...transaction,
        ...(accumulatedStakes[key] || {}),
        assets: {
          label: {
            holdings:
              transaction.transaction_category === 'stake'
                ? `${(accumulatedStakes[key]?.amount || 0) + (transaction.amount as number) * action} stakes`
                : `${transaction.amount || 0} tokens`,
            price:
              transaction.transaction_category === 'stake'
                ? `${
                    (
                      (accumulatedStakes[key]?.avgPrice || 0) +
                        parseFloat(
                          (
                            parseFloat(`${transaction.price}`) /
                            WEI_PER_ETHER /
                            (transaction.amount as number)
                          ).toFixed(5),
                        ) *
                          action || 0
                    )?.toFixed?.(5) || 0.0
                  } ${'ETH'}`
                : // TODO: fix display value for this
                  transaction.totalPrice,
          },
          sortValue:
            transaction.transaction_category === 'stake'
              ? (accumulatedStakes[key]?.amount || 0) +
                (transaction.amount as number) * action
              : transaction.amount,
        },
      };
    });

    return (
      Object.values(accumulatedStakes)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((transaction: any) => ({ ...transaction }))
        .filter((transaction) => transaction.amount > 0)
    );
  })();

  return (
    <section className="MyTokens">
      <CWTable
        columnInfo={tableState.columns}
        sortingState={tableState.sorting}
        setSortingState={tableState.setSorting}
        rowData={stakes.map((tx) => ({
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
          assets: {
            sortValue: tx.assets.sortValue,
            customElement: (
              <div className="asset-value">
                <CWText type="b1" fontWeight="semiBold">
                  {tx.assets.label.holdings} /
                </CWText>
                <CWText type="caption">{tx.assets.label.price}</CWText>
              </div>
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

export { MyTokens };
