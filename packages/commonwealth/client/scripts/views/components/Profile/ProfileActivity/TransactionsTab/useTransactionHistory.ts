import { WEI_PER_ETHER } from 'controllers/chain/ethereum/util';
import { trpc } from 'utils/trpcClient';
import { buildEtherscanLink } from 'views/modals/ManageCommunityStakeModal/utils';
import { formatFractionalValue } from '../../../FractionalValue/helpers';
import { FilterOptions } from '../types';

export type TransactionHistoryProps = {
  filterOptions: FilterOptions;
  addressFilter: string[];
};

const useTransactionHistory = ({
  filterOptions,
  addressFilter,
}: TransactionHistoryProps) => {
  const { data } = trpc.community.getTransactions.useQuery({
    addresses: addressFilter.length >= 1 ? addressFilter.join(',') : undefined,
  });

  let filteredData = !data
    ? []
    : data.map((t) => {
        const tempPrice =
          t.transaction_category === 'stake'
            ? t.price
            : formatFractionalValue(t.price);
        return {
          ...t,
          timestamp: t.timestamp * 1000,
          transaction_type:
            t.transaction_category === 'stake'
              ? t.transaction_type === 'buy'
                ? 'mint'
                : 'burn'
              : t.transaction_type,
          totalPrice:
            t.transaction_category === 'stake'
              ? `${(parseFloat(`${t.price}`) / WEI_PER_ETHER).toFixed(5)} ETH`
              : `${
                  typeof tempPrice === 'string' || typeof tempPrice === 'number'
                    ? tempPrice
                    : `0.${Array.from({ length: tempPrice.decimal0Count })
                        .map((_) => `0`)
                        .join('')}${tempPrice.valueAfterDecimal0s}`
                } ETH`,
          etherscanLink: buildEtherscanLink(
            t.transaction_hash,
            t.community?.chain_node_id || 0,
          ),
        };
      });

  // filter by community name and symbol
  if (filterOptions.searchText) {
    filteredData = filteredData.filter((tx) =>
      (tx.community.default_symbol + tx.community.name)
        .toLowerCase()
        .includes((filterOptions.searchText || '').toLowerCase()),
    );
  }

  return filteredData;
};

export default useTransactionHistory;
