import { trpc } from 'utils/trpcClient';

const AGGREGATE_CONTEXT_STALE_TIME = 5 * 60 * 1000; // 5 minutes

interface Mention {
  id: string;
  type: 'user' | 'topic' | 'thread' | 'community' | 'proposal';
  name: string;
}

interface UseAggregateContextProps {
  mentions: Mention[];
  communityId?: string;
  contextDataDays?: number;
  enabled?: boolean;
}

export const useAggregateContext = ({
  mentions,
  communityId,
  contextDataDays = 30,
  enabled = true,
}: UseAggregateContextProps) => {
  return trpc.search.aggregateContext.useQuery(
    {
      mentions: JSON.stringify(mentions),
      communityId,
      contextDataDays,
    },
    {
      enabled: enabled && mentions.length > 0,
      staleTime: AGGREGATE_CONTEXT_STALE_TIME,
    },
  );
};
