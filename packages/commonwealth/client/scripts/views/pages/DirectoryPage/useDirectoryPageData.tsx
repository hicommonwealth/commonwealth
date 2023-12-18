import { isCommandClick } from 'helpers';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import ChainInfo from 'models/ChainInfo';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import React, { useCallback, useMemo } from 'react';
import { useFetchRelatedCommunitiesQuery } from 'state/api/communities';
import { CWCommunityAvatar } from 'views/components/component_kit/cw_community_avatar';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  MixpanelClickthroughEvent,
  MixpanelClickthroughPayload,
} from '../../../../../shared/analytics/types';

export enum ViewType {
  Rows = 'Rows',
  Tiles = 'Tiles',
}
interface UseDirectoryPageDataProps {
  chainNodeId: number;
  searchTerm: string;
  selectedViewType: ViewType;
}

const useDirectoryPageData = ({
  chainNodeId,
  searchTerm,
  selectedViewType,
}: UseDirectoryPageDataProps) => {
  const navigate = useCommonNavigate();
  const { data: relatedCommunities = [], isLoading } =
    useFetchRelatedCommunitiesQuery({
      chainNodeId,
    });

  const { trackAnalytics } =
    useBrowserAnalyticsTrack<MixpanelClickthroughPayload>({
      onAction: true,
    });

  const handleClick = useCallback(
    (e, communityId: string) => {
      e.preventDefault();
      trackAnalytics({
        event: MixpanelClickthroughEvent.DIRECTORY_TO_COMMUNITY_PAGE,
      });
      if (isCommandClick(e)) {
        window.open(`/${communityId}`, '_blank');
        return;
      }
      navigateToCommunity({ navigate, path: '', chain: communityId });
    },
    [navigate, trackAnalytics],
  );

  const relatedCommunitiesData = useMemo(
    () =>
      relatedCommunities.map((c) => ({
        name: c.community,
        nameLower: c.community.toLowerCase(),
        description: c.description,
        members: c.address_count,
        threads: c.thread_count,
        iconUrl: c.icon_url,
        id: c.id,
      })),
    [relatedCommunities],
  );

  const filteredRelatedCommunitiesData = useMemo(
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
            community={{ iconUrl: c.iconUrl, name: c.name } as ChainInfo}
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
