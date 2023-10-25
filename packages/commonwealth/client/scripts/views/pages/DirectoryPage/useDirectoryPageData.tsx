import ChainInfo from 'models/ChainInfo';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useMemo } from 'react';
import { useFetchRelatedCommunitiesQuery } from 'state/api/communities';
import { CWCommunityAvatar } from 'views/components/component_kit/cw_community_avatar';
import { CWText } from 'views/components/component_kit/cw_text';

export enum ViewType {
  Rows = 'Rows',
  Tiles = 'Tiles',
}
interface UseDirectoryPageDataProps {
  chainNodeId: number;
  debouncedSearchTerm: string;
  selectedViewType: ViewType;
}
const useDirectoryPageData = ({
  chainNodeId,
  debouncedSearchTerm,
  selectedViewType,
}: UseDirectoryPageDataProps) => {
  const navigate = useCommonNavigate();
  const { data: relatedCommunities } = useFetchRelatedCommunitiesQuery({
    chainNodeId,
  });

  const relatedCommunitiesData = useMemo(
    () =>
      (relatedCommunities || []).map((c) => ({
        name: c.community,
        description: c.description,
        members: c.address_count,
        threads: c.thread_count,
        iconUrl: c.icon_url,
        id: c.id,
      })),
    [relatedCommunities]
  );

  const filteredRelatedCommunitiesData = useMemo(
    () =>
      relatedCommunitiesData.filter((c) =>
        c.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase().trim())
      ),
    [debouncedSearchTerm, relatedCommunitiesData]
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
          onClick={() => navigate(`/${c.id}`, {}, null)}
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
  }, [filteredRelatedCommunitiesData, navigate, selectedViewType]);

  return { filteredRelatedCommunitiesData, tableData };
};

export default useDirectoryPageData;
