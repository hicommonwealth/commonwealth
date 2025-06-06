import { GetLaunchpadTrades } from '@hicommonwealth/schemas';
import { formatUnits } from 'ethers/lib/utils';
import { formatAddressShort } from 'helpers';
import React, { useEffect, useMemo, useState } from 'react';
import { useGetLaunchpadTradesQuery } from 'state/api/launchPad';
import { useTokensMetadataQuery } from 'state/api/tokens';
import useUserStore from 'state/ui/user';
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
import useTransactionHistory from './useTransactionHistory';

type GetLaunchpadTradesOutput = typeof GetLaunchpadTrades.output._output;

type TransactionHistoryItem = {
  address: string;
  timestamp: number;
  amount: number;
  etherscanLink: string;
  community: {
    id: string;
    name: string;
    default_symbol: string;
    icon_url: string;
    chain_node_id: number;
  };
  transaction_category: 'launchpad' | 'stake';
  transaction_type: 'buy' | 'sell';
  totalPrice: string;
  price: number;
  transaction_hash: string;
  community_id: string;
};

const BASE_ADDRESS_FILTER = {
  label: 'All addresses',
  value: '',
};

type TransactionsTabProps = {
  transactionsType: 'tokens' | 'history';
  showFilterOptions?: boolean;
  searchText?: string;
  prefetchedData?: GetLaunchpadTradesOutput;
};

const transformLaunchpadTradeData = (
  trades: GetLaunchpadTradesOutput | null | undefined,
  metadataMap: Record<
    string,
    | { decimals?: number; name?: string; symbol?: string; icon_url?: string }
    | undefined
  >,
): TransactionHistoryItem[] => {
  if (!trades) return [];

  return trades.map((trade) => {
    const meta = metadataMap[trade.token_address?.toLowerCase()] || {};
    const decimals = meta.decimals ?? 18;
    const formattedAmount = formatUnits(
      trade.community_token_amount || '0',
      decimals,
    );

    return {
      address: trade.trader_address,
      timestamp: trade.timestamp * 1000,
      amount: parseFloat(formattedAmount),
      etherscanLink: buildEtherscanLink(
        trade.transaction_hash,
        trade.eth_chain_id,
      ),
      community: {
        id: trade.community_id,
        name: trade.name,
        default_symbol: trade.symbol,
        icon_url: trade.community_icon_url,
        chain_node_id: trade.eth_chain_id,
      },
      transaction_category: 'launchpad',
      transaction_type: trade.is_buy ? 'buy' : 'sell',
      totalPrice: `${formatUnits(Math.round(trade.price * 1e18) || '0', 18)} ETH`,
      price: trade.price,
      transaction_hash: trade.transaction_hash,
      community_id: trade.token_address,
    };
  });
};

const TransactionsTab = ({
  transactionsType,
  showFilterOptions = true,
  searchText = '',
  prefetchedData,
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

  const { data: launchpadData } = useGetLaunchpadTradesQuery({
    trader_addresses: user.addresses.map((u) => u.address),
  });

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

  let addressFilter = [filterOptions.selectedAddress?.value].filter(
    (v): v is string => typeof v === 'string',
  );
  if (filterOptions.selectedAddress?.value === '') {
    addressFilter = possibleAddresses;
  }

  const { openMagicWallet } = useAuthentication({});

  const tokenAddresses = useMemo((): string[] => {
    if (!prefetchedData) return [];
    const filteredAddresses: string[] = prefetchedData
      .map((t) => t.token_address?.toLowerCase())
      .filter((a): a is string => !!a);
    return [...new Set(filteredAddresses)];
  }, [prefetchedData]);

  const { data: tokensMetadata } = useTokensMetadataQuery({
    tokenIds: tokenAddresses,
    nodeEthChainId: prefetchedData?.[0]?.eth_chain_id ?? 0,
  });

  const metadataMap = useMemo(() => {
    if (!tokensMetadata) return {};
    return tokensMetadata.reduce(
      (acc, meta) => {
        if (meta?.tokenId) {
          acc[meta.tokenId.toLowerCase()] = meta;
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

  const transformedPrefetchedData = transformLaunchpadTradeData(
    launchpadData,
    metadataMap,
  );

  const locallyFilteredData = useMemo(() => {
    if (!transformedPrefetchedData) return undefined;
    if (!filterOptions.searchText) return transformedPrefetchedData;

    return transformedPrefetchedData.filter((tx) =>
      (tx.transaction_category === 'launchpad'
        ? `${tx.community.name} (${tx.community.default_symbol})`
        : `${tx.community.default_symbol} ${tx.community.name}`
      )
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
                setFilterOptions((filters) => ({
                  ...filters,
                  selectedAddress: option ?? undefined,
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
