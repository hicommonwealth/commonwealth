import { MagnifyingGlass } from '@phosphor-icons/react';
import clsx from 'clsx';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useCallback, useEffect, useState } from 'react';
import app from 'state';
import {
  useGetCommunityByIdQuery,
  useGetCommunitySelectedTagsAndCommunities,
  useUpdateCommunityDirectoryTags,
} from 'state/api/communities';
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
import {
  MixpanelCommunityInteractionEvent,
  MixpanelPageViewEvent,
} from '../../../../../shared/analytics/types';
import useAppStatus from '../../../hooks/useAppStatus';
import Permissions from '../../../utils/Permissions';
import CWCircleMultiplySpinner from '../../components/component_kit/new_designs/CWCircleMultiplySpinner';
import './DirectoryPage.scss';
import DirectorySettingsDrawer from './DirectorySettingsDrawer';
import ShowAddedCommunities from './ShowAddedCommunities';
import ShowAddedTags from './ShowAddedTags';

const DirectoryPage = () => {
  const navigate = useCommonNavigate();
  const [communitySearch, setCommunitySearch] = useState('');
  const [selectedViewType, setSelectedViewType] = useState(ViewType.Rows);
  const [isDirectorySettingsDrawerOpen, setIsDirectorySettingsDrawerOpen] =
    useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<any[]>([]);
  const [filteredTableData, setFilteredTableData] = useState<any[]>([]);
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

  const {
    data: communityTagsAndCommunities,
    isLoading: isLoadingTagsAndCommunities,
  } = useGetCommunitySelectedTagsAndCommunities({
    community_id: communityId,
    enabled: !!communityId,
  });
  console.log('communityTagsAndCommunities', communityTagsAndCommunities);
  const { mutateAsync: updateCommunityDirectoryTags } =
    useUpdateCommunityDirectoryTags();
  console.log('communityTagsAndCommunities:: ', communityTagsAndCommunities);

  const getFilteredCommunities = useCallback(
    (communities: any[], tags: string[], manualSelections: string[]) => {
      if (
        !communities ||
        (tags.length === 0 && manualSelections.length === 0)
      ) {
        return communities || [];
      }
      if (manualSelections.length > 0) {
        return communities.filter((comm) => manualSelections.includes(comm.id));
      }
      if (tags.length > 0) {
        return communities.filter((comm) =>
          tags.some((tag) => comm.tag_names?.includes(tag)),
        );
      }
      return communities;
    },
    [],
  );

  useEffect(() => {
    if (!communityTagsAndCommunities?.[0]) return;

    const initialTags = communityTagsAndCommunities[0].tag_names || [];
    const initialCommunities =
      communityTagsAndCommunities[0].selected_community_ids || [];

    // Set initial selected tags and communities
    setSelectedTags(initialTags);
    setSelectedCommunities(initialCommunities);

    // If we have related communities data, apply initial filtering
    if (filteredRelatedCommunitiesData) {
      const initialFilteredCommunities = getFilteredCommunities(
        filteredRelatedCommunitiesData,
        initialTags,
        initialCommunities,
      );

      setFilteredCommunities(initialFilteredCommunities);

      // Update table data based on filtered communities
      if (tableData) {
        const newTableData = tableData.filter((row) =>
          initialFilteredCommunities.some(
            (filteredItem) => filteredItem.id === row.id,
          ),
        );
        setFilteredTableData(newTableData);
      }
    }
  }, [
    communityTagsAndCommunities,
    filteredRelatedCommunitiesData,
    tableData,
    getFilteredCommunities,
  ]);

  useEffect(() => {
    if (!filteredRelatedCommunitiesData || !tableData) return;

    const newFilteredCommunities = getFilteredCommunities(
      filteredRelatedCommunitiesData,
      selectedTags,
      selectedCommunities,
    );

    setFilteredCommunities(newFilteredCommunities);

    const newTableData = tableData.filter((row) =>
      newFilteredCommunities.some((filteredItem) => filteredItem.id === row.id),
    );
    setFilteredTableData(newTableData);
  }, [
    selectedTags,
    selectedCommunities,
    filteredRelatedCommunitiesData,
    tableData,
    getFilteredCommunities,
  ]);

  const handleCreateCommunity = () => {
    navigate('/createCommunity', {}, null);
  };

  const { trackAnalytics } = useBrowserAnalyticsTrack({
    payload: {
      event: MixpanelCommunityInteractionEvent.DIRECTORY_SETTINGS_CHANGED,
      isPWA: isAddedToHomeScreen,
    },
  });

  const handleSaveChanges = async () => {
    try {
      await updateCommunityDirectoryTags({
        community_id: communityId,
        tag_names: selectedTags,
        selected_community_ids: selectedCommunities,
      });
      setIsDirectorySettingsDrawerOpen(false);
      trackAnalytics({
        event: MixpanelCommunityInteractionEvent.DIRECTORY_SETTINGS_CHANGED,
        isPWA: isAddedToHomeScreen,
      });
    } catch (error) {
      //change this to a toast?
      console.error('Failed to update Directory page:', error);
    }
  };

  const isAdmin =
    Permissions.isSiteAdmin() ||
    Permissions.isCommunityAdmin() ||
    Permissions.isCommunityModerator();

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
        <div className="search-row-and-filter">
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
              {isAdmin && (
                <CWButton
                  iconLeft="gear"
                  buttonType="secondary"
                  label="Directory Settings"
                  onClick={() => setIsDirectorySettingsDrawerOpen(true)}
                />
              )}
            </div>
          </div>
          <div>
            <ShowAddedTags
              selectedTags={selectedTags}
              onRemoveTag={(tag) =>
                setSelectedTags(selectedTags.filter((t) => t !== tag))
              }
            />
            <ShowAddedCommunities
              selectedCommunities={selectedCommunities}
              onRemoveCommunity={(manualCommunity) =>
                setSelectedCommunities(
                  selectedCommunities.filter((c) => c !== manualCommunity),
                )
              }
            />
          </div>
        </div>

        <DirectoryPageContent
          isLoading={isLoading}
          noFilteredCommunities={noFilteredCommunities}
          noCommunitiesInChain={noCommunitiesInChain}
          chainName={baseChain?.name}
          communitySearch={communitySearch}
          filteredRelatedCommunitiesData={filteredCommunities}
          tableData={filteredTableData}
          selectedViewType={selectedViewType}
        />
        <DirectorySettingsDrawer
          isOpen={isDirectorySettingsDrawerOpen}
          onClose={() => setIsDirectorySettingsDrawerOpen(false)}
          filteredRelatedCommunitiesData={filteredRelatedCommunitiesData}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          selectedCommunities={selectedCommunities}
          setSelectedCommunities={setSelectedCommunities}
          handleSaveChanges={handleSaveChanges}
        />
      </div>
    </CWPageLayout>
  );
};

export default DirectoryPage;
