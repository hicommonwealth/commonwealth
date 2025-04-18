import { isCommandClick } from 'helpers';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import React, { useCallback, useMemo } from 'react';
import { useFetchRelatedCommunitiesQuery } from 'state/api/communities';
import { useFetchNodesQuery } from 'state/api/nodes';
import { getNodeById } from 'state/api/nodes/utils';
import { CWCommunityAvatar } from 'views/components/component_kit/cw_community_avatar';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  MixpanelClickthroughEvent,
  MixpanelClickthroughPayload,
} from '../../../../../shared/analytics/types';
import useAppStatus from '../../../hooks/useAppStatus';

export enum ViewType {
  Rows = 'Rows',
  Tiles = 'Tiles',
}

export interface CommunityData {
  ChainNode;
  name: string;
  nameLower: string;
  namespace: string;
  description: string;
  members: string;
  threads: string;
  iconUrl: string;
  id: string;
  tag_ids: string[];
}

interface UseDirectoryPageDataProps {
  chainNodeId?: number;
  searchTerm: string;
  selectedViewType: ViewType;
}

const useDirectoryPageData = ({
  chainNodeId,
  searchTerm,
  selectedViewType,
}: UseDirectoryPageDataProps) => {
  const navigate = useCommonNavigate();
  const { data: nodes } = useFetchNodesQuery();
  const { data: relatedCommunities = [], isLoading } =
    useFetchRelatedCommunitiesQuery({
      chainNodeId,
    });

  const { isAddedToHomeScreen } = useAppStatus();

  const { trackAnalytics } =
    useBrowserAnalyticsTrack<MixpanelClickthroughPayload>({
      onAction: true,
    });

  const handleClick = useCallback(
    (e, communityId: string) => {
      e.preventDefault();
      trackAnalytics({
        event: MixpanelClickthroughEvent.DIRECTORY_TO_COMMUNITY_PAGE,
        isPWA: isAddedToHomeScreen,
      });
      if (isCommandClick(e)) {
        window.open(`/${communityId}`, '_blank');
        return;
      }
      navigateToCommunity({ navigate, path: '', chain: communityId });
    },
    [navigate, trackAnalytics, isAddedToHomeScreen],
  );

  const relatedCommunitiesData = useMemo<CommunityData[]>(
    () =>
      relatedCommunities.map((c) => ({
        ChainNode: getNodeById(c.chain_node_id, nodes),
        name: c.community,
        nameLower: c.community.toLowerCase(),
        namespace: c.namespace,
        description: c.description,
        members: c.profile_count,
        threads: c.lifetime_thread_count,
        iconUrl: c.icon_url,
        id: c.id,
        tag_ids: c.tag_ids || [],
      })),
    [nodes, relatedCommunities],
  );

  const filteredRelatedCommunitiesData = useMemo<CommunityData[]>(
    () =>
      relatedCommunitiesData.filter((c) => c.nameLower.includes(searchTerm)),
    [searchTerm, relatedCommunitiesData],
  );

  const tableData = useMemo(() => {
    if (selectedViewType !== ViewType.Rows) {
      return [];
    }

    return filteredRelatedCommunitiesData.map((c) => ({
      ...c,
      community: (
        <div
          className="community-name-cell"
          onClick={(e) => handleClick(e, c.id)}
        >
          <CWCommunityAvatar
            size="medium"
            community={{ iconUrl: c.iconUrl, name: c.name }}
          />
          <CWText type="b2" fontWeight="medium">
            {c.name}
          </CWText>
        </div>
      ),
    }));
  }, [filteredRelatedCommunitiesData, handleClick, selectedViewType]);

  const noCommunitiesInChain = relatedCommunitiesData.length === 0;
  const noFilteredCommunities = filteredRelatedCommunitiesData.length === 0;

  return {
    filteredRelatedCommunitiesData,
    tableData,
    isLoading,
    noCommunitiesInChain,
    noFilteredCommunities,
  };
};

export default useDirectoryPageData;
