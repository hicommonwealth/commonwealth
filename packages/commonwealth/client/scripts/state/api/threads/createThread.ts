import { ChainBase, toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { signThread } from 'controllers/server/sessions';
import { resetXPCacheForUser } from 'helpers/quest';
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
  communityBase: ChainBase;
  title: string;
  topic: Topic;
  body?: string;
  url?: string;
  ethChainIdOrBech32Prefix?: string | number;
  turnstileToken?: string | null;
}

export const buildCreateThreadInput = async ({
  address,
  kind,
  stage,
  communityId,
  communityBase,
  title,
  topic,
  body,
  url,
  ethChainIdOrBech32Prefix,
  turnstileToken,
}: CreateThreadProps) => {
  const canvasSignedData = await signThread(address, {
    community: communityId,
    base: communityBase,
    title,
    body,
    link: url,
    topic: topic.id,
    ethChainIdOrBech32Prefix,
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
    turnstile_token: turnstileToken,
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
      resetXPCacheForUser(utils);

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
