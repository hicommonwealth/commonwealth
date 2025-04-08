import { resetXPCacheForUser } from 'helpers/quest';
import { trpc } from 'utils/trpcClient';

export function useDeleteQuestMutation() {
  const utils = trpc.useUtils();

  return trpc.quest.deleteQuest.useMutation({
    onSuccess: () => {
      resetXPCacheForUser(utils);
    },
  });
}
