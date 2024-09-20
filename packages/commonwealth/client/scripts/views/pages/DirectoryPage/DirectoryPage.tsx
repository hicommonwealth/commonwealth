import { MagnifyingGlass } from '@phosphor-icons/react';
import clsx from 'clsx';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import app from 'state';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { useFetchNodesQuery } from 'state/api/nodes';
import { getNodeById } from 'state/api/nodes/utils';
import { useDebounce } from 'usehooks-ts';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import DirectoryPageContent from 'views/pages/DirectoryPage/DirectoryPageContent';
import useDirectoryPageData, {
  ViewType,
} from 'views/pages/DirectoryPage/useDirectoryPageData';
import ErrorPage from 'views/pages/error';
import { MixpanelPageViewEvent } from '../../../../../shared/analytics/types';
import useAppStatus from '../../../hooks/useAppStatus';
import CWCircleMultiplySpinner from '../../components/component_kit/new_designs/CWCircleMultiplySpinner';
import './DirectoryPage.scss';

const DirectoryPage = () => {
  const navigate = useCommonNavigate();
  const [communitySearch, setCommunitySearch] = useState('');
  const [selectedViewType, setSelectedViewType] = useState(ViewType.Rows);
  const communitySearchDebounced = useDebounce<string>(communitySearch, 500);

  const { data: nodes } = useFetchNodesQuery();

  const communityId = app.activeChainId() || '';
  const { data: community, isLoading: isLoadingCommunity } =
    useGetCommunityByIdQuery({
      id: communityId,
      enabled: !!communityId,
      includeNodeInfo: true,
    });
  const directoryPageEnabled = community?.directory_page_enabled;
  const communityDefaultChainNodeId = community?.ChainNode?.id;
  const selectedChainNodeId = community?.directory_page_chain_node_id;
  const defaultChainNodeId = selectedChainNodeId ?? communityDefaultChainNodeId;
  const baseChain = defaultChainNodeId
    ? getNodeById(defaultChainNodeId, nodes)
    : undefined;

  const { isAddedToHomeScreen } = useAppStatus();

  const {
    tableData,
    filteredRelatedCommunitiesData,
    isLoading,
    noFilteredCommunities,
    noCommunitiesInChain,
  } = useDirectoryPageData({
    chainNodeId: baseChain?.id,
    searchTerm: communitySearchDebounced.toLowerCase().trim(),
    selectedViewType,
  });

  const handleCreateCommunity = () => {
    navigate('/createCommunity', {}, null);
  };

  useBrowserAnalyticsTrack({
    payload: {
      event: MixpanelPageViewEvent.DIRECTORY_PAGE_VIEW,
      isPWA: isAddedToHomeScreen,
    },
  });

  if (isLoadingCommunity) {
    return <CWCircleMultiplySpinner />;
  }

  if (!directoryPageEnabled) {
    return (
      <ErrorPage message="Directory Page is not enabled for this community." />
    );
  }

  return (
    <CWPageLayout>
      <div className="DirectoryPage">
        <div className="header-row">
          <CWText type="h2"> Directory</CWText>
          <CWButton
            label="Create community"
            iconLeft="plus"
            onClick={handleCreateCommunity}
          />
        </div>
        <CWText className="page-description">
          Access relevant communities linked to your base chain for a connected
          experience.
        </CWText>
        <CWDivider />
        <CWText type="h4" className="subtitle">
          {baseChain?.name} ecosystem
        </CWText>
        <div className="search-row">
          <div className="community-search">
            <CWTextInput
              value={communitySearch}
              onInput={(e: any) => setCommunitySearch(e.target.value)}
              fullWidth
              placeholder="Search communities"
              iconLeft={<MagnifyingGlass size={24} weight="regular" />}
            />
          </div>
          <div className="toggle-view-icons">
            <div
              className={clsx('icon-container', {
                selected: selectedViewType === ViewType.Rows,
              })}
            >
              <CWIconButton
                onClick={() => setSelectedViewType(ViewType.Rows)}
                iconName="rows"
                weight="light"
              />
            </div>
            <div
              className={clsx('icon-container', {
                selected: selectedViewType === ViewType.Tiles,
              })}
            >
              <CWIconButton
                onClick={() => setSelectedViewType(ViewType.Tiles)}
                iconName="squaresFour"
                weight="light"
              />
            </div>
          </div>
        </div>

        <DirectoryPageContent
          isLoading={isLoading}
          noFilteredCommunities={noFilteredCommunities}
          noCommunitiesInChain={noCommunitiesInChain}
          chainName={baseChain?.name}
          communitySearch={communitySearch}
          filteredRelatedCommunitiesData={filteredRelatedCommunitiesData}
          tableData={tableData}
          selectedViewType={selectedViewType}
        />
      </div>
    </CWPageLayout>
  );
};

export default DirectoryPage;
