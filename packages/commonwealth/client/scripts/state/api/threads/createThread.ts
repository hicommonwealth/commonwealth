import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { signThread } from 'controllers/server/sessions';
import type { Topic } from 'models/Topic';
import { ThreadStage } from 'models/types';
import useUserOnboardingSliderMutationStore from 'state/ui/userTrainingCards';
import { trpc } from 'utils/trpcClient';
import { UserTrainingCardTypes } from 'views/components/UserTrainingSlider/types';
import { useAuthModalStore } from '../../ui/modals';
import useUserStore from '../../ui/user';
import { updateCommunityThreadCount } from '../communities/getCommuityById';
import { addThreadInAllCaches } from './helpers/cache';

interface CreateThreadProps {
  address: string;
  kind: 'discussion' | 'link';
  stage: string;
  communityId: string;
  title: string;
  topic: Topic;
  body?: string;
  url?: string;
}

export const buildCreateThreadInput = async ({
  address,
  kind,
  stage,
  communityId,
  title,
  topic,
  body,
  url,
}: CreateThreadProps) => {
  const canvasSignedData = await signThread(address, {
    community: communityId,
    title,
    body,
    link: url,
    topic: topic.id,
  });
  return {
    community_id: communityId,
    topic_id: topic.id!,
    title: title,
    body: body ?? '',
    kind,
    stage,
    url,
    read_only: false,
    ...toCanvasSignedDataApiArgs(canvasSignedData),
  };
};

const useCreateThreadMutation = ({
  communityId,
}: Partial<CreateThreadProps>) => {
  const utils = trpc.useUtils();

  const { markTrainingActionAsComplete } =
    useUserOnboardingSliderMutationStore();

  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  const user = useUserStore();

  return trpc.thread.createThread.useMutation({
    onSuccess: async (newThread) => {
      // @ts-expect-error StrictNullChecks
      addThreadInAllCaches(communityId, newThread);

      // increment communities thread count
      if (communityId) {
        updateCommunityThreadCount(
          communityId,
          'increment',
          newThread.stage === ThreadStage.Voting,
          utils,
        );
      }

      const userId = user.addresses?.[0]?.profile?.userId;
      userId &&
        markTrainingActionAsComplete(
          UserTrainingCardTypes.CreateContent,
          userId,
        );

      return newThread;
    },
    onError: (error) => checkForSessionKeyRevalidationErrors(error),
  });
};

export default useCreateThreadMutation;
