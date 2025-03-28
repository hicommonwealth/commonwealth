import { MagnifyingGlass } from '@phosphor-icons/react';
import clsx from 'clsx';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
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
import Permissions from '../../../utils/Permissions';
import CWCircleMultiplySpinner from '../../components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import './DirectoryPage.scss';
import DirectorySettingsModal from './DirectorySettingsModal';

const DirectoryPage = () => {
  const navigate = useCommonNavigate();
  const [communitySearch, setCommunitySearch] = useState('');
  const [selectedViewType, setSelectedViewType] = useState(ViewType.Rows);
  const [isDirectorySettingsModalOpen, setIsDirectorySettingsModalOpen] =
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

  const getFilteredCommunities = React.useCallback(
    (communities: any[], tags: string[], manualSelections: string[]) => {
      if (tags.length === 0 && manualSelections.length === 0) {
        return communities;
      }

      const manuallySelectedCommunities =
        manualSelections.length > 0
          ? communities.filter((manualSelectedCommunity) =>
              manualSelections.includes(manualSelectedCommunity.name),
            )
          : [];

      const communitiesFromTags =
        tags.length > 0
          ? communities.filter((tagSelectedCommunity) =>
              tagSelectedCommunity.tag_ids?.some((tagId) =>
                tags.includes(tagId),
              ),
            )
          : [];

      return [...manuallySelectedCommunities, ...communitiesFromTags].filter(
        (item, index, self) =>
          index === self.findIndex((c) => c.id === item.id),
      );
    },
    [],
  );

  useEffect(() => {
    if (filteredRelatedCommunitiesData && tableData) {
      const newFilteredCommunities = getFilteredCommunities(
        filteredRelatedCommunitiesData,
        selectedTags,
        selectedCommunities,
      );

      setFilteredCommunities(newFilteredCommunities);

      const newTableData = tableData.filter((row) =>
        newFilteredCommunities.some(
          (filteredItem) => filteredItem.id === row.id,
        ),
      );
      setFilteredTableData(newTableData);
    }
  }, [
    filteredRelatedCommunitiesData,
    tableData,
    selectedTags,
    selectedCommunities,
    getFilteredCommunities,
  ]);

  useEffect(() => {
    if (filteredRelatedCommunitiesData && tableData) {
      setFilteredCommunities(filteredRelatedCommunitiesData);
      setFilteredTableData(tableData);
    }
  }, [filteredRelatedCommunitiesData, tableData]);

  const handleCreateCommunity = () => {
    navigate('/createCommunity', {}, null);
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
                  onClick={() => setIsDirectorySettingsModalOpen(true)}
                />
              )}
            </div>
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
        {isDirectorySettingsModalOpen && isAdmin && (
          <CWModal
            size="small"
            content={
              <DirectorySettingsModal
                filteredRelatedCommunitiesData={filteredRelatedCommunitiesData}
                onModalClose={() => setIsDirectorySettingsModalOpen(false)}
                selectedTags={selectedTags}
                setSelectedTags={setSelectedTags}
                selectedCommunities={selectedCommunities}
                setSelectedCommunities={setSelectedCommunities}
              />
            }
            open={true}
            onClose={() => setIsDirectorySettingsModalOpen(false)}
          />
        )}
      </div>
    </CWPageLayout>
  );
};

export default DirectoryPage;
