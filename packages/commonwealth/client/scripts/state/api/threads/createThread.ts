import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { signThread } from 'controllers/server/sessions';
import MinimumProfile from 'models/MinimumProfile';
import Thread from 'models/Thread';
import Topic from 'models/Topic';
import { ThreadStage } from 'models/types';
import app from 'state';
import useUserOnboardingSliderMutationStore from 'state/ui/userTrainingCards';
import { UserTrainingCardTypes } from 'views/components/UserTrainingSlider/types';
import { useAuthModalStore } from '../../ui/modals';
import { EXCEPTION_CASE_threadCountersStore } from '../../ui/thread';
import useUserStore, { userStore } from '../../ui/user';
import { addThreadInAllCaches } from './helpers/cache';
import { updateCommunityThreadCount } from './helpers/counts';

interface CreateThreadProps {
  address: string;
  kind: 'discussion' | 'link';
  stage: string;
  communityId: string;
  title: string;
  topic: Topic;
  body?: string;
  url?: string;
  readOnly?: boolean;
  authorProfile: MinimumProfile;
  isPWA?: boolean;
}

const createThread = async ({
  address,
  kind,
  stage,
  communityId,
  title,
  topic,
  body,
  url,
  readOnly,
  authorProfile,
  isPWA,
}: CreateThreadProps): Promise<Thread> => {
  const canvasSignedData = await signThread(address, {
    community: communityId,
    title,
    body,
    link: url,
    topic: topic.id,
  });

  const response = await axios.post(
    `${app.serverUrl()}/threads`,
    {
      author_community_id: communityId,
      community_id: communityId,
      address,
      author: JSON.stringify(authorProfile),
      title: encodeURIComponent(title),
      // @ts-expect-error StrictNullChecks
      body: encodeURIComponent(body),
      kind,
      stage,
      topic_name: topic.name,
      topic_id: topic.id,
      url,
      readOnly,
      jwt: userStore.getState().jwt,
      ...toCanvasSignedDataApiArgs(canvasSignedData),
    },
    {
      headers: {
        isPWA: isPWA?.toString(),
      },
    },
  );

  return new Thread(response.data.result);
};

const useCreateThreadMutation = ({
  communityId,
}: Partial<CreateThreadProps>) => {
  const { markTrainingActionAsComplete } =
    useUserOnboardingSliderMutationStore();

  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  const user = useUserStore();

  return useMutation({
    mutationFn: createThread,
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

      // increment communities thread count
      if (communityId) updateCommunityThreadCount(communityId, 'increment');

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
