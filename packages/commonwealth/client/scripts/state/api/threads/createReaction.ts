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
}

export const buildCreateThreadReactionInput = async ({
  address,
  reactionType = 'like',
  threadId,
  threadMsgId,
}: CreateReactionProps) => {
  const canvasSignedData = await signThreadReaction(address, {
    thread_id: threadMsgId ?? null,
    like: reactionType === 'like',
  });
  return {
    author_community_id: userStore.getState().activeAccount?.community?.id,
    thread_id: threadId,
    thread_msg_id: threadMsgId ?? null,
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
  currentReactionCount,
  currentReactionWeightsSum,
}: IUseCreateThreadReactionMutation & {
  currentReactionCount: number;
  currentReactionWeightsSum: string;
}) => {
  const { markTrainingActionAsComplete } =
    useUserOnboardingSliderMutationStore();

  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  const user = useUserStore();
  const utils = trpc.useUtils();

  return trpc.thread.createThreadReaction.useMutation({
    onSuccess: (newReaction) => {
      // reset xp cache
      utils.quest.getQuests.invalidate().catch(console.error);
      utils.user.getXps.invalidate().catch(console.error);

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

      const addition = (
        BigInt(currentReactionWeightsSum) +
        BigInt(reaction.voting_weight || '0')
      ).toString();

      updateThreadInAllCaches(communityId, threadId, {
        reactionCount: currentReactionCount + 1,
        // I think it is broken here
        reactionWeightsSum: addition,
      });

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
