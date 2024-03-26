import { formatAddressShort } from 'helpers';
import React from 'react';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { trpc } from '../../../../utils/trpcClient';
import { buildEtherscanLink } from '../../../modals/ManageCommunityStakeModal/utils';
import CommunityInfo from '../common/CommunityInfo';
import { FilterOptions } from '../types';
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

type StakesProps = {
  filterOptions: FilterOptions;
  addressFilter: string[];
};

const Stakes = ({ filterOptions, addressFilter }: StakesProps) => {
  const { data } = trpc.community.getStakeTransaction.useQuery({
    addresses: addressFilter.join(','),
  });

  const WEI_PER_ETHER = 1000000000000000000;
  let filteredData = !data
    ? []
    : data.map((t) => ({
        community: t.community,
        address: t.address,
        stake: t.stake_amount,
        voteWeight: t.stake_amount * t.vote_weight,
        avgPrice: `${(
          parseFloat(t.stake_price) /
          WEI_PER_ETHER /
          t.stake_amount
        ).toFixed(5)} ETH`,
        etherscanLink: buildEtherscanLink(t.transaction_hash),
      }));

  // filter by community name and symbol
  if (filterOptions.searchText) {
    filteredData = filteredData.filter((tx) =>
      (tx.community.default_symbol + tx.community.name)
        .toLowerCase()
        .includes(filterOptions.searchText.toLowerCase()),
    );
  }

  return (
    <section className="Stakes">
      <CWTable
        columnInfo={columnInfo}
        rowData={filteredData.map((tx) => ({
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
