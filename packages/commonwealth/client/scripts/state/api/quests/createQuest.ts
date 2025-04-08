import { resetXPCacheForUser } from 'helpers/quest';
import { trpc } from 'utils/trpcClient';

export function useCreateQuestMutation() {
  const utils = trpc.useUtils();

  return trpc.quest.createQuest.useMutation({
    onSuccess: () => {
      resetXPCacheForUser(utils);
    },
  });
}
