import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { signThread } from 'controllers/server/sessions';
import Topic from 'models/Topic';
import { ThreadStage } from 'models/types';
import useUserOnboardingSliderMutationStore from 'state/ui/userTrainingCards';
import { UserTrainingCardTypes } from 'views/components/UserTrainingSlider/types';
import { trpc } from '../../../utils/trpcClient';
import { useAuthModalStore } from '../../ui/modals';
import { EXCEPTION_CASE_threadCountersStore } from '../../ui/thread';
import useUserStore from '../../ui/user';
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
    topic_id: topic.id,
    title: encodeURIComponent(title),
    body: encodeURIComponent(body ?? ''),
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
  const { markTrainingActionAsComplete } =
    useUserOnboardingSliderMutationStore();

  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  const user = useUserStore();

  return trpc.thread.createThread.useMutation({
    onSuccess: async (newThread) => {
      // @ts-expect-error StrictNullChecks
      addThreadInAllCaches(communityId, newThread);

      // Update community level thread counters variables
      EXCEPTION_CASE_threadCountersStore.setState(
        ({ totalThreadsInCommunity, totalThreadsInCommunityForVoting }) => ({
          totalThreadsInCommunity: totalThreadsInCommunity + 1,
          totalThreadsInCommunityForVoting:
            newThread.stage === ThreadStage.Voting
              ? totalThreadsInCommunityForVoting + 1
              : totalThreadsInCommunityForVoting,
        }),
      );

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
