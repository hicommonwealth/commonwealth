import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { notifyError } from 'client/scripts/controllers/app/notifications';
import { signThreadReaction } from 'controllers/server/sessions';
import app from 'state';
import { SERVER_URL } from 'state/api/config';
import useUserOnboardingSliderMutationStore from 'state/ui/userTrainingCards';
import { UserTrainingCardTypes } from 'views/components/UserTrainingSlider/types';
import { useAuthModalStore } from '../../ui/modals';
import useUserStore, { userStore } from '../../ui/user';
import { updateThreadInAllCaches } from './helpers/cache';

interface IUseCreateThreadReactionMutation {
  threadId: number;
  threadMsgId: string;
  communityId: string;
}
interface CreateReactionProps extends IUseCreateThreadReactionMutation {
  address: string;
  reactionType?: 'like';
  isPWA?: boolean;
}

const createReaction = async ({
  address,
  reactionType = 'like',
  threadId,
  threadMsgId,
  isPWA,
}: CreateReactionProps) => {
  const canvasSignedData = await signThreadReaction(address, {
    thread_id: threadMsgId,
    like: reactionType === 'like',
  });

  return await axios.post(
    `${SERVER_URL}/threads/${threadId}/reactions`,
    {
      author_community_id: userStore.getState().activeAccount?.community?.id,
      thread_id: threadId,
      thread_msg_id: threadMsgId,
      community_id: app.chain.id,
      address,
      reaction: reactionType,
      jwt: userStore.getState().jwt,
      ...toCanvasSignedDataApiArgs(canvasSignedData),
    },
    {
      headers: {
        isPWA: isPWA?.toString(),
      },
    },
  );
};

const useCreateThreadReactionMutation = ({
  communityId,
  threadId,
}: IUseCreateThreadReactionMutation) => {
  const { markTrainingActionAsComplete } =
    useUserOnboardingSliderMutationStore();

  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  const user = useUserStore();

  return useMutation({
    mutationFn: createReaction,
    onSuccess: async (response) => {
      const reaction: any = {
        id: response.data.result.id,
        address: response.data.result.Address.address,
        type: 'like',
        updated_at: response.data.result.updated_at,
        voting_weight: response.data.result.calculated_voting_weight || 0,
      };
      updateThreadInAllCaches(
        communityId,
        threadId,
        { associatedReactions: [reaction] },
        'combineAndRemoveDups',
      );

      const userId = user.addresses?.[0]?.profile?.userId;
      userId &&
        markTrainingActionAsComplete(UserTrainingCardTypes.GiveUpvote, userId);
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.data?.error?.toLowerCase().includes('stake')) {
          notifyError('Buy stake in community to upvote threads');
        }
      }
      return checkForSessionKeyRevalidationErrors(error);
    },
  });
};

export default useCreateThreadReactionMutation;
