import { WEI_PER_ETHER } from 'controllers/chain/ethereum/util';
import { formatAddressShort } from 'helpers';
import React from 'react';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import useTransactionHistory, {
  TransactionHistoryProps,
} from '../../../../hooks/useTransactionHistory';
import CommunityInfo from '../common/CommunityInfo';
import './Stakes.scss';
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
    key: 'stake',
    header: 'Stake',
    numeric: true,
    sortable: true,
  },
  {
    key: 'voteWeight',
    header: 'Vote weight',
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
    key: 'etherscanLink',
    header: () => <CWIcon iconName="etherscan" iconSize="regular" />,
    numeric: false,
    sortable: false,
  },
];

const Stakes = ({ filterOptions, addressFilter }: TransactionHistoryProps) => {
  const data = useTransactionHistory({ filterOptions, addressFilter });

  // aggregate transaction per community per address
  const stakes = (() => {
    const map = {};

    data.map((x) => {
      const key = (x.community.id + x.address).toLowerCase();
      const action = x.action === 'mint' ? 1 : -1;

      map[key] = {
        ...x,
        ...(map[key] || {}),
        stake: (map[key]?.stake || 0) + x?.stake * action,
        voteWeight: (map[key]?.voteWeight || 0) + x?.voteWeight * action,
        avgPrice:
          (map[key]?.avgPrice || 0) +
          parseFloat(
            (parseFloat(x.price) / WEI_PER_ETHER / x.stake).toFixed(5),
          ) *
            action,
      };
    });

    return Object.values(map).map((x: any) => ({
      ...x,
      voteWeight: x.voteWeight + 1, // total vote weight is +1 of the stake weight
      avgPrice: `${x.avgPrice.toFixed(5)} ETH`,
    }));
  })();

  return (
    <section className="Stakes">
      <CWTable
        columnInfo={columnInfo}
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

export { Stakes };
