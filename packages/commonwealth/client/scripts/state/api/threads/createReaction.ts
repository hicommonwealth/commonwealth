import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { AxiosError } from 'axios';
import { notifyError } from 'client/scripts/controllers/app/notifications';
import { trpc } from 'client/scripts/utils/trpcClient';
import { signThreadReaction } from 'controllers/server/sessions';
import app from 'state';
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

export const buildCreateThreadReactionInput = async ({
  address,
  reactionType = 'like',
  threadId,
  threadMsgId,
}: CreateReactionProps) => {
  const canvasSignedData = await signThreadReaction(address, {
    thread_id: threadMsgId,
    like: reactionType === 'like',
  });
  return {
    author_community_id: userStore.getState().activeAccount?.community?.id,
    thread_id: threadId,
    thread_msg_id: threadMsgId,
    community_id: app.chain.id,
    address,
    reaction: reactionType,
    jwt: userStore.getState().jwt,
    ...toCanvasSignedDataApiArgs(canvasSignedData),
  };
};

const useCreateThreadReactionMutation = ({
  communityId,
  threadId,
}: IUseCreateThreadReactionMutation) => {
  const { markTrainingActionAsComplete } =
    useUserOnboardingSliderMutationStore();

  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  const user = useUserStore();

  return trpc.thread.createThreadReaction.useMutation({
    onSuccess: (newReaction) => {
      const reaction: any = {
        id: newReaction.id,
        address: newReaction.Address!.address,
        type: 'like',
        updated_at: newReaction.updated_at,
        voting_weight: newReaction.calculated_voting_weight || 0,
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
