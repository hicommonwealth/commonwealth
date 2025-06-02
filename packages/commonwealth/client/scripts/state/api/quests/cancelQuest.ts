import { resetXPCacheForUser } from 'helpers/quest';
import { trpc } from 'utils/trpcClient';

export function useCancelQuestMutation() {
  const utils = trpc.useUtils();

  return trpc.quest.cancelQuest.useMutation({
    onSuccess: () => {
      resetXPCacheForUser(utils);
    },
  });
}
