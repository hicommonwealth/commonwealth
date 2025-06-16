import { MagnifyingGlass } from '@phosphor-icons/react';
import clsx from 'clsx';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import app from 'state';
import {
  useGetCommunityByIdQuery,
  useGetCommunitySelectedTagsAndCommunities,
  useUpdateCommunityDirectoryTags,
} from 'state/api/communities';
import { useFetchNodesQuery } from 'state/api/nodes';
import { getNodeById } from 'state/api/nodes/utils';
import { useFetchTagsQuery } from 'state/api/tags';
import { useDebounce } from 'usehooks-ts';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import DirectoryPageContent from 'views/pages/DirectoryPage/DirectoryPageContent';
import useDirectoryPageData, {
  CommunityData,
  RowType,
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
import AppliedFiltersAndTagsRow from './AppliedFiltersAndTagsRow';
import './DirectoryPage.scss';
import DirectorySettingsDrawer from './DirectorySettingsDrawer';
import ShowAddedTags from './ShowAddedTags';

const DirectoryPage = () => {
  const [communitySearch, setCommunitySearch] = useState('');
  const [selectedViewType, setSelectedViewType] = useState(ViewType.Rows);
  const [isDirectorySettingsDrawerOpen, setIsDirectorySettingsDrawerOpen] =
    useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<
    CommunityData[]
  >([]);
  const [filteredTableData, setFilteredTableData] = useState<RowType[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const communitySearchDebounced = useDebounce<string>(communitySearch, 500);

  const { data: nodes } = useFetchNodesQuery();
  const { data: tagsForFilter } = useFetchTagsQuery({ enabled: true });
  const navigate = useCommonNavigate();

  const [filteredTagsList, setFilteredTagsList] = useState<
    { label: string; value: string }[]
  >([]);

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
    error: tagsAndCommunitiesError,
    refetch: refetchTagsAndCommunities,
  } = useGetCommunitySelectedTagsAndCommunities({
    community_id: communityId,
    enabled: !!communityId,
  });

  const { mutateAsync: updateCommunityDirectoryTags } =
    useUpdateCommunityDirectoryTags();

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

  const getFilteredCommunities = useCallback(
    <T extends CommunityData>(
      communities: T[],
      tags: string[],
      manualSelections: string[],
    ): T[] => {
      if (!communities) {
        return [];
      }

      if (tags.length === 0 && manualSelections.length === 0) {
        return communities;
      }

      return communities.filter((comm) => {
        const matchesTags =
          tags.length > 0 && tags.some((tag) => comm.tag_ids?.includes(tag));

        const matchesManualSelection =
          manualSelections.length > 0 && manualSelections.includes(comm.id);

        return matchesTags || matchesManualSelection;
      });
    },
    [],
  );

  useEffect(() => {
    if (isLoadingTagsAndCommunities) {
      return;
    }
    if (tagsAndCommunitiesError) {
      console.error(
        'Error loading tags and communities:',
        tagsAndCommunitiesError,
      );
      return;
    }

    const communityData = communityTagsAndCommunities?.[0] || {
      tag_names: [],
      selected_community_ids: [],
    };

    const initialTags = Array.isArray(communityData.tag_names)
      ? communityData.tag_names
      : [];
    const initialCommunities = Array.isArray(
      communityData.selected_community_ids,
    )
      ? communityData.selected_community_ids
      : [];

    setSelectedTags(initialTags);
    setSelectedCommunities(initialCommunities);

    if (filteredRelatedCommunitiesData) {
      const initialFilteredCommunities = getFilteredCommunities(
        filteredRelatedCommunitiesData,
        initialTags,
        initialCommunities,
      );
      setFilteredCommunities(initialFilteredCommunities);

      if (tableData) {
        const newTableData = getFilteredCommunities(
          tableData,
          initialTags,
          initialCommunities,
        );

        setFilteredTableData(newTableData);
      }
    }
  }, [
    communityTagsAndCommunities,
    isLoadingTagsAndCommunities,
    tagsAndCommunitiesError,
    filteredRelatedCommunitiesData,
    tableData,
    getFilteredCommunities,
  ]);

  useEffect(() => {
    const getFilteredTags = () => {
      const filteredTags = tagsForFilter
        ?.filter((tag) => selectedTags.includes(tag.name))
        .map((tag) => ({
          label: tag.name,
          value: String(tag.id),
        }));

      if (selectedCommunities.length > 0) {
        return [
          ...(filteredTags || []),
          { label: 'Admin picked', value: 'admin-picked' },
        ];
      }

      return filteredTags;
    };
    const filteredTags = getFilteredTags() || [];
    setFilteredTagsList(filteredTags);
  }, [tagsForFilter, selectedTags, selectedCommunities]);

  useEffect(() => {
    if (!filteredRelatedCommunitiesData || !tableData) return;

    if (appliedFilters.length === 0) {
      setFilteredCommunities(filteredRelatedCommunitiesData);
      setFilteredTableData(tableData);
      return;
    }

    const filterLogic = (comm) => {
      return appliedFilters.some((filter) => {
        if (filter.label === 'Admin picked') {
          return selectedCommunities.includes(comm.id);
        }

        return (
          Array.isArray(comm.tag_ids) && comm.tag_ids.includes(filter.label)
        );
      });
    };

    const newFilteredCommunities =
      filteredRelatedCommunitiesData.filter(filterLogic);
    setFilteredCommunities(newFilteredCommunities);

    const newTableData = tableData.filter(filterLogic);
    setFilteredTableData(newTableData);
  }, [
    appliedFilters,
    filteredRelatedCommunitiesData,
    tableData,
    selectedCommunities,
  ]);

  const { trackAnalytics } = useBrowserAnalyticsTrack({
    payload: {
      event: MixpanelCommunityInteractionEvent.DIRECTORY_SETTINGS_CHANGED,
      isPWA: isAddedToHomeScreen,
    },
    onAction: true,
  });

  const handleCreateCommunity = () => {
    navigate('/createCommunity', {}, null);
  };

  const handleFilterClick = (value: { label: string; value: string }) => {
    if (!appliedFilters.some((filter) => filter.value === value.value)) {
      setAppliedFilters([...appliedFilters, value]);
    }
  };

  const handleRemoveFilter = (filterToRemove: {
    label: string;
    value: string;
  }) => {
    setAppliedFilters(
      appliedFilters.filter((filter) => filter.value !== filterToRemove.value),
    );
  };

  const handleClearAllFilters = () => {
    setAppliedFilters([]);
  };

  const handleSaveChanges = () => {
    const validTags = selectedTags || [];
    const validCommunities = selectedCommunities || [];

    updateCommunityDirectoryTags({
      community_id: communityId,
      tag_names: validTags,
      selected_community_ids: validCommunities,
    })
      .then(() => {
        setIsDirectorySettingsDrawerOpen(false);
        return refetchTagsAndCommunities();
      })
      .then(() => {
        notifySuccess('Directory Settings updated successfully!');
        trackAnalytics({
          event: MixpanelCommunityInteractionEvent.DIRECTORY_SETTINGS_CHANGED,
          isPWA: isAddedToHomeScreen,
        });
      })
      .catch((error) => {
        console.log(error);
        notifyError('Failed to update Directory Settings');
      });
  };

  const displayTableData = useMemo(() => {
    if (appliedFilters.length > 0) {
      return filteredTableData;
    }

    return getFilteredCommunities(
      tableData || [],
      selectedTags,
      selectedCommunities,
    );
  }, [
    filteredTableData,
    tableData,
    appliedFilters.length,
    selectedTags,
    selectedCommunities,
    getFilteredCommunities,
  ]);

  if (isLoadingCommunity) {
    return <CWCircleMultiplySpinner />;
  }

  if (!directoryPageEnabled) {
    return (
      <ErrorPage message="Directory Page is not enabled for this community." />
    );
  }

  if (isLoadingTagsAndCommunities) {
    return <CWCircleMultiplySpinner />;
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
          Discover related communities that your admin has curated for you.
        </CWText>
        <CWDivider />
        <CWText type="h4" className="subtitle">
          {community?.name} ecosystem
        </CWText>
        <div className="search-row-and-filter">
          <div className="search-row">
            <div className="community-search">
              <CWTextInput
                value={communitySearch}
                onInput={(e) => setCommunitySearch(e.target.value)}
                fullWidth
                placeholder="Search communities"
                iconLeft={<MagnifyingGlass size={24} weight="regular" />}
              />
            </div>
            <div className="tag-selection-list">
              <CWSelectList
                options={filteredTagsList}
                onClick={handleFilterClick}
                placeholder="Filter"
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
          <div className="applied-filters-and-tags-row">
            <AppliedFiltersAndTagsRow
              onCloseClick={handleClearAllFilters}
              appliedFilters={appliedFilters}
              onRemoveFilter={handleRemoveFilter}
            />
          </div>
          <div>
            <ShowAddedTags
              selectedTags={selectedTags}
              isLoading={isLoadingTagsAndCommunities}
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
          tableData={displayTableData}
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
