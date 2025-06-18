import { resetXPCacheForUser } from 'helpers/quest';
import { trpc } from 'utils/trpcClient';

export function useVerifyQuestActionMutation() {
  const utils = trpc.useUtils();

  return trpc.quest.verifyQuestAction.useMutation({
    onSuccess: () => {
      resetXPCacheForUser(utils);
    },
  });
}
