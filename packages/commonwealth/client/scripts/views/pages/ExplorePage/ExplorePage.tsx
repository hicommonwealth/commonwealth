import React from 'react';
import ExplorePageContent from './ExplorePageContent';
import ExplorePageManageCommunityStakeModal from './ExplorePageManageCommunityStakeModal';
import ExplorePageShell from './ExplorePageShell';
import { useExploreData } from './useExploreData';

const ExplorePage = () => {
  const {
    activeTab,
    clearSearch,
    closeManageCommunityStakeModal,
    containerRef,
    ethUsdRate,
    handleSearchTextChange,
    handleTabClick,
    historicalPrices,
    isCommunitiesDataLoading,
    marketsEnabled,
    modeOfManageCommunityStakeModal,
    predictionMarketsEnabled,
    searchText,
    selectedCommunityId,
    setSelectedCommunityId,
    tabViews,
  } = useExploreData();

  return (
    <ExplorePageShell
      activeTab={activeTab}
      containerRef={containerRef}
      onSearchTextChange={handleSearchTextChange}
      onTabClick={handleTabClick}
      searchText={searchText}
      tabViews={tabViews}
    >
      <ExplorePageContent
        activeTab={activeTab}
        containerRef={containerRef}
        ethUsdRate={ethUsdRate}
        historicalPrices={historicalPrices}
        isCommunitiesDataLoading={isCommunitiesDataLoading}
        marketsEnabled={marketsEnabled}
        onClearSearch={clearSearch}
        predictionMarketsEnabled={predictionMarketsEnabled}
        searchText={searchText}
        setSelectedCommunityId={setSelectedCommunityId}
      />
      <ExplorePageManageCommunityStakeModal
        mode={modeOfManageCommunityStakeModal}
        onClose={closeManageCommunityStakeModal}
        selectedCommunityId={selectedCommunityId}
      />
    </ExplorePageShell>
  );
};

export default ExplorePage;
