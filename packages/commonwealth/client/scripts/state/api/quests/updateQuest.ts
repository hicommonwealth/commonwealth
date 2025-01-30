import { trpc } from 'utils/trpcClient';

export function useUpdateQuestMutation() {
  return trpc.quest.updateQuest.useMutation();
}
