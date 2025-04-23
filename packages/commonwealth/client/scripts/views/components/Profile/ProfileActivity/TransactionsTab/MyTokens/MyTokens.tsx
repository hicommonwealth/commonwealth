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

  const stakes = (() => {
    const accumulatedStakes: Record<string, any> = {};

    for (const transaction of transactions) {
      const key = (
        transaction.community.id + transaction.address
      ).toLowerCase();

      const action =
        transaction.transaction_type === 'mint' ||
        transaction.transaction_type === 'buy'
          ? 1
          : -1;

      const prev = accumulatedStakes[key] || {};
      const amount = transaction.amount as number;
      const avgPrice = transaction.price as number;
      const isStake = transaction.transaction_category === 'stake';

      const updatedAmount = (prev.amount || 0) + amount * action;
      const updatedAvgPrice = (prev.avgPrice || 0) + avgPrice;

      accumulatedStakes[key] = {
        ...transaction,
        ...prev,
        amount: updatedAmount,
        avgPrice: updatedAvgPrice,
        assets: {
          label: {
            holdings: isStake
              ? `${updatedAmount} stakes`
              : `${updatedAmount || 0} tokens`,
            price: `${updatedAvgPrice} ETH`,
          },
        },
        sortValue: updatedAmount,
      };
    }

    return Object.values(accumulatedStakes).filter(
      (tx) => tx.amount && tx.amount > 0,
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
