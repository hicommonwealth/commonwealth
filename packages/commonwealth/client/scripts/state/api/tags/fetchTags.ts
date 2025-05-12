import Tag from 'models/Tag';
import { trpc } from 'utils/trpcClient';

const TAGS_STALE_TIME = 60 * 1_000; // 60 s

const useFetchTagsQuery = () => {
  return trpc.tag.getTags.useQuery({
    staleTime: TAGS_STALE_TIME,
    select: (data) => {
      return data.map((t) => new Tag(t));
    },
  });
};

export default useFetchTagsQuery;
