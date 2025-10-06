import Tag from 'models/Tag';
import { trpc } from 'utils/trpcClient';

const TAGS_STALE_TIME = 60 * 1_000; // 60 s

const useFetchTagsQuery = ({
  with_community_count,
  enabled = true,
}: {
  with_community_count?: boolean;
  enabled: boolean;
}) => {
  return trpc.tag.getTags.useQuery(
    { with_community_count },
    {
      staleTime: TAGS_STALE_TIME,
      enabled,
      select: (data) => {
        return data.map((t) => new Tag(t));
      },
    },
  );
};

export default useFetchTagsQuery;
