import { trpc } from 'utils/trpcClient';

export function useCreateQuestMutation() {
  const utils = trpc.useUtils();

  return trpc.quest.createQuest.useMutation({
    onSuccess: () => {
      // reset xp cache
      utils.quest.getQuests.invalidate().catch(console.error);
      utils.user.getXps.invalidate().catch(console.error);
    },
  });
}
