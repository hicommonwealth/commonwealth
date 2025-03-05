import { GetQuest } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

const FETCH_QUESTS_STALE_TIME = 60 * 3_000; // 3 mins

type UseGetQuestByIdProps = z.infer<typeof GetQuest.input> & {
  enabled?: boolean;
};

const useGetQuestByIdQuery = ({
  quest_id,
  enabled = true,
}: UseGetQuestByIdProps) => {
  return trpc.quest.getQuest.useQuery(
    {
      quest_id,
    },
    {
      cacheTime: FETCH_QUESTS_STALE_TIME,
      enabled,
    },
  );
};

export { useGetQuestByIdQuery };
