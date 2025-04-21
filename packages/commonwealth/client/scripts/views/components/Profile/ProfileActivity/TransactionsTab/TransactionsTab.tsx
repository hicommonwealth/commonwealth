import { formatUnits } from 'ethers/lib/utils';
import { formatAddressShort } from 'helpers';
import React, { useEffect, useMemo, useState } from 'react';
import { useTokensMetadataQuery } from 'state/api/tokens';
import useUserStore from 'state/ui/user';
import { GetLaunchpadTradesOutput } from 'types/api';
import { buildEtherscanLink } from 'views/modals/ManageCommunityStakeModal/utils';
import useAuthentication from '../../../../modals/AuthModal/useAuthentication';
import { CWIcon } from '../../../component_kit/cw_icons/cw_icon';
import { CWText } from '../../../component_kit/cw_text';
import { CWButton } from '../../../component_kit/new_designs/CWButton';
import { CWSelectList } from '../../../component_kit/new_designs/CWSelectList';
import { CWTextInput } from '../../../component_kit/new_designs/CWTextInput';
import { FilterOptions } from '../types';
import MyTokens from './MyTokens';
import NoTransactionHistory from './NoTransactionHistory';
import TransactionsHistory from './TransactionHistory';
import './TransactionsTab.scss';
import useTransactionHistory, {
  TransactionHistoryItem,
} from './useTransactionHistory';

const BASE_ADDRESS_FILTER = {
  label: 'All addresses',
  value: '',
};

type TransactionsTabProps = {
  transactionsType: 'tokens' | 'history';
  showFilterOptions?: boolean;
  searchText?: string;
  prefetchedData?: GetLaunchpadTradesOutput;
  isPrefetchedLoading?: boolean;
};

const transformLaunchpadTradeData = (
  trades: GetLaunchpadTradesOutput,
  metadataMap: Record<
    string,
    | { decimals?: number; name?: string; symbol?: string; icon_url?: string }
    | undefined
  >,
): TransactionHistoryItem[] => {
  return trades.map((trade) => {
    const meta = metadataMap[trade.token_address?.toLowerCase()] || {};
    const decimals = meta.decimals ?? 18;
    const formattedAmount = formatUnits(
      trade.community_token_amount || '0',
      decimals,
    );

    return {
      address: trade.account_address,
      timestamp: trade.timestamp * 1000,
      amount: parseFloat(formattedAmount),
      etherscanLink: buildEtherscanLink(trade.trade_hash, trade.chain_node_id),
      community: {
        id: trade.community_address,
        name: meta.name || 'Launchpad Community',
        default_symbol: meta.symbol || 'LPAD',
        icon_url: meta.icon_url || '',
        chain_node_id: trade.chain_node_id,
      },
      transaction_category: 'Launchpad',
      transaction_type: trade.is_buy ? 'buy' : 'sell',
      totalPrice: 'N/A',
      price: '0',
      transaction_hash: trade.trade_hash,
      community_id: trade.community_address,
      user_id: trade.user_id,
    };
  });
};

const TransactionsTab = ({
  transactionsType,
  showFilterOptions = true,
  searchText = '',
  prefetchedData,
  isPrefetchedLoading = false,
}: TransactionsTabProps) => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchText,
    selectedAddress: BASE_ADDRESS_FILTER,
  });

  useEffect(() => {
    setFilterOptions((prev) => ({
      ...prev,
      searchText,
    }));
  }, [searchText]);

  const user = useUserStore();
  const hasMagic = user.hasMagicWallet;

  const ADDRESS_FILTERS = [
    BASE_ADDRESS_FILTER,
    ...[...new Set(user.addresses.map((x) => x.address))].map((address) => ({
      label: formatAddressShort(address, 5, 6),
      value: address,
    })),
  ];

  const possibleAddresses = ADDRESS_FILTERS.filter((a) => a.value !== '').map(
    (a) => a.value,
  );

  // @ts-expect-error <StrictNullChecks/>
  let addressFilter = [filterOptions.selectedAddress.value];
  // @ts-expect-error <StrictNullChecks/>
  if (filterOptions.selectedAddress.value === '') {
    addressFilter = possibleAddresses;
  }

  const { openMagicWallet } = useAuthentication({});

  const tokenAddresses = useMemo(() => {
    if (!prefetchedData) return [];
    return [
      ...new Set(
        prefetchedData
          .map((t) => t.token_address?.toLowerCase())
          .filter((a): a is string => !!a),
      ),
    ];
  }, [prefetchedData]);

  const { data: tokensMetadata, isLoading: isLoadingMetadata } =
    useTokensMetadataQuery({
      tokenIds: tokenAddresses,
      enabled: tokenAddresses.length > 0,
    });

  const metadataMap = useMemo(() => {
    if (!tokensMetadata) return {};
    return tokensMetadata.reduce(
      (acc, meta) => {
        if (meta?.token_address) {
          acc[meta.token_address.toLowerCase()] = meta;
        }
        return acc;
      },
      {} as Record<string, (typeof tokensMetadata)[number]>,
    );
  }, [tokensMetadata]);

  const hookData = useTransactionHistory({
    filterOptions,
    addressFilter,
  });

  const transformedPrefetchedData = useMemo(() => {
    if (!prefetchedData || isLoadingMetadata) return undefined;
    return transformLaunchpadTradeData(prefetchedData, metadataMap);
  }, [prefetchedData, metadataMap, isLoadingMetadata]);

  const locallyFilteredData = useMemo(() => {
    if (!transformedPrefetchedData) return undefined;
    if (!filterOptions.searchText) return transformedPrefetchedData;

    return transformedPrefetchedData.filter((tx) =>
      (tx.community.default_symbol + tx.community.name)
        .toLowerCase()
        .includes((filterOptions.searchText || '').toLowerCase()),
    );
  }, [transformedPrefetchedData, filterOptions.searchText]);

  const dataToDisplay = locallyFilteredData || hookData;

  return (
    <section className="TransactionsTab">
      {showFilterOptions && (
        <section className="filters">
          {hasMagic && (
            <div className="title-and-wallet-button">
              <CWButton
                label="Open wallet"
                onClick={() => {
                  openMagicWallet().catch(console.error);
                }}
              />
            </div>
          )}
          <CWTextInput
            size="large"
            fullWidth
            placeholder="Search community name or symbol"
            containerClassName="search-input-container"
            inputClassName="search-input"
            iconLeft={<CWIcon iconName="search" className="search-icon" />}
            onInput={(e) =>
              setFilterOptions((options) => ({
                ...options,
                searchText: e.target.value?.trim(),
              }))
            }
          />
          <div className="select-list-container">
            <CWText fontWeight="medium">Filter</CWText>
            <CWSelectList
              isSearchable={false}
              isClearable={false}
              options={ADDRESS_FILTERS}
              value={filterOptions.selectedAddress}
              onChange={(option) =>
                // @ts-expect-error <StrictNullChecks/>
                setFilterOptions((filters) => ({
                  ...filters,
                  selectedAddress: option,
                }))
              }
            />
          </div>
        </section>
      )}

      {!(dataToDisplay?.length > 0) ? (
        <NoTransactionHistory
          withSelectedAddress={!!filterOptions?.selectedAddress?.value}
        />
      ) : (
        <>
          {transactionsType === 'tokens' && (
            <MyTokens transactions={dataToDisplay || []} />
          )}
          {transactionsType === 'history' && (
            <TransactionsHistory transactions={dataToDisplay || []} />
          )}
        </>
      )}
    </section>
  );
};

export { TransactionsTab };
