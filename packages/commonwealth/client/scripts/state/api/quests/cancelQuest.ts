import { trpc } from 'utils/trpcClient';

export function useCancelQuestMutation() {
  const utils = trpc.useUtils();

  return trpc.quest.cancelQuest.useMutation({
    onSuccess: () => {
      // reset xp cache
      utils.quest.getQuests.invalidate().catch(console.error);
      utils.user.getXps.invalidate().catch(console.error);
    },
  });
}
