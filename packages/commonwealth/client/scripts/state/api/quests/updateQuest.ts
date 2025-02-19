import { trpc } from 'utils/trpcClient';

export function useUpdateQuestMutation() {
  const utils = trpc.useUtils();

  return trpc.quest.updateQuest.useMutation({
    onSuccess: () => {
      utils.quest.getQuest.invalidate();
      utils.quest.getQuests.invalidate();
    },
  });
}
