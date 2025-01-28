import { trpc } from 'utils/trpcClient';

export function useCreateQuestMutation() {
  const utils = trpc.useUtils();

  return trpc.quest.createQuest.useMutation({
    onSuccess: () => {
      // reset xp cache
      utils.quest.getQuests.invalidate();
      utils.user.getXps.invalidate();
    },
  });
}
