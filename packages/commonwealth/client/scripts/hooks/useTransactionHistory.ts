import { trpc } from '../utils/trpcClient';
import { buildEtherscanLink } from '../views/modals/ManageCommunityStakeModal/utils';
import { FilterOptions } from '../views/pages/MyCommunityStake/types';

export type TransactionHistoryProps = {
  filterOptions: FilterOptions;
  addressFilter: string[];
};

const useTransactionHistory = ({
  filterOptions,
  addressFilter,
}: TransactionHistoryProps) => {
  const { data } = trpc.community.getStakeTransaction.useQuery({
    addresses: addressFilter.length > 0 ? addressFilter.join(',') : undefined,
  });

  const WEI_PER_ETHER = 1000000000000000000;
  let filteredData = !data
    ? []
    : data.map((t) => ({
        community: t.community,
        address: t.address,
        stake: t.stake_amount,
        voteWeight: t.stake_amount * t.vote_weight,
        timestamp: t.timestamp * 1000,
        action: t.stake_direction === 'buy' ? 'mint' : 'burn',
        totalPrice: `${(parseFloat(t.stake_price) / WEI_PER_ETHER).toFixed(
          5,
        )} ETH`,
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

  return filteredData;
};

export default useTransactionHistory;
