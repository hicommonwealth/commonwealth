import { trpc } from 'utils/trpcClient';

export function useDeleteQuestMutation() {
  const utils = trpc.useUtils();

  return trpc.quest.deleteQuest.useMutation({
    onSuccess: () => {
      // reset xp cache
      utils.quest.getQuests.invalidate().catch(console.error);
      utils.user.getXps.invalidate().catch(console.error);
    },
  });
}
