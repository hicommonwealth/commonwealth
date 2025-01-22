import { trpc } from 'utils/trpcClient';

export function useCreateQuestMutation() {
  return trpc.quest.createQuest.useMutation();
}
