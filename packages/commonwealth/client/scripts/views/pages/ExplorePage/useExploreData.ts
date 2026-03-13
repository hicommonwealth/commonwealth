import { useCommonNavigate } from 'navigation/helpers';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFlag } from 'shared/hooks/useFlag';
import { useFetchTokenUsdRateQuery } from 'state/api/communityStake/index';
import { useManageCommunityStakeModalStore } from 'state/ui/modals';
import { trpc } from 'utils/trpcClient';

export type ExploreTabView = {
  label: string;
  value: string;
};

export const useExploreData = () => {
  const containerRef = useRef<HTMLElement | undefined>(undefined);
  const marketsEnabled = useFlag('markets');
  const predictionMarketsEnabled = useFlag('futarchy');
  const navigate = useCommonNavigate();
  const [searchParams] = useSearchParams();
  const [searchText, setSearchText] = useState('');

  const tabViews = useMemo<ExploreTabView[]>(
    () => [
      { value: 'all', label: 'All' },
      { value: 'communities', label: 'Communities' },
      { value: 'users', label: 'Users' },
      { value: 'contests', label: 'Contests' },
      { value: 'threads', label: 'Threads' },
      { value: 'quests', label: 'Quests' },
      { value: 'tokens', label: 'Tokens' },
      ...(marketsEnabled ? [{ value: 'markets', label: 'Markets' }] : []),
      ...(predictionMarketsEnabled
        ? [{ value: 'prediction-markets', label: 'Prediction Markets' }]
        : []),
    ],
    [marketsEnabled, predictionMarketsEnabled],
  );

  const activeTab = searchParams.get('tab') || 'all';

  const {
    setModeOfManageCommunityStakeModal,
    modeOfManageCommunityStakeModal,
  } = useManageCommunityStakeModalStore();

  const [selectedCommunityId, setSelectedCommunityId] = useState<string>();
  const oneDayAgo = useRef(Date.now() - 24 * 60 * 60 * 1000);

  const { data: historicalPrices, isLoading: isLoadingHistoricalPrices } =
    trpc.community.getStakeHistoricalPrice.useQuery({
      past_date_epoch: oneDayAgo.current / 1000,
    });

  const { data: ethUsdRateData, isLoading: isLoadingEthUsdRate } =
    useFetchTokenUsdRateQuery({
      tokenSymbol: 'ETH',
    });

  const handleTabClick = useCallback(
    (tabValue: string) => {
      const params = new URLSearchParams(searchParams);
      params.set('tab', tabValue);
      navigate(`/explore?${params.toString()}`);
    },
    [navigate, searchParams],
  );

  const handleSearchTextChange = useCallback((nextSearchText: string) => {
    setSearchText(nextSearchText);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchText('');
  }, []);

  const closeManageCommunityStakeModal = useCallback(() => {
    // The store initializes this field with null, but the setter type was not widened.
    // Keep the existing modal-close behavior until the store typing is normalized.
    // @ts-expect-error <StrictNullChecks/>
    setModeOfManageCommunityStakeModal(null);
  }, [setModeOfManageCommunityStakeModal]);

  return {
    activeTab,
    clearSearch,
    closeManageCommunityStakeModal,
    containerRef,
    ethUsdRate: Number(ethUsdRateData?.data?.data?.amount),
    handleSearchTextChange,
    handleTabClick,
    historicalPrices,
    isCommunitiesDataLoading: isLoadingHistoricalPrices || isLoadingEthUsdRate,
    marketsEnabled,
    modeOfManageCommunityStakeModal,
    predictionMarketsEnabled,
    searchText,
    selectedCommunityId,
    setSelectedCommunityId,
    tabViews,
  };
};
