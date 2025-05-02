import { trpc } from 'utils/trpcClient';

const COMMUNITY_TAGS_STALE_TIME = 60 * 3_000; // 3 mins

type UseGetCommunitySelectedTagsAndCommunitiesProps = {
  community_id: string;
  enabled?: boolean;
};

const useGetCommunitySelectedTagsAndCommunities = ({
  community_id,
  enabled,
}: UseGetCommunitySelectedTagsAndCommunitiesProps) => {
  return trpc.community.getCommunitySelectedTagsAndCommunities.useQuery(
    {
      community_id,
    },
    {
      staleTime: COMMUNITY_TAGS_STALE_TIME,
      enabled,
    },
  );
};

export default useGetCommunitySelectedTagsAndCommunities;
