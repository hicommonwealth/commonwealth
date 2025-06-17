import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { AxiosError } from 'axios';
import { notifyError } from 'controllers/app/notifications';
import { signThreadReaction } from 'controllers/server/sessions';
import { resetXPCacheForUser } from 'helpers/quest';
import app from 'state';
import useUserOnboardingSliderMutationStore from 'state/ui/userTrainingCards';
import { trpc } from 'utils/trpcClient';
import { UserTrainingCardTypes } from 'views/components/UserTrainingSlider/types';
import { useAuthModalStore } from '../../ui/modals';
import useUserStore, { userStore } from '../../ui/user';

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
      resetXPCacheForUser(utils);

      const reaction: any = {
        id: newReaction.id,
        address: newReaction.Address!.address,
        type: 'like',
        updated_at: newReaction.updated_at,
        voting_weight: newReaction.calculated_voting_weight || 0,
        calculated_voting_weight: newReaction.calculated_voting_weight || 0,
      };

      utils.thread.getThreadById.setData({ thread_id: threadId }, (oldData) => {
        if (!oldData) return oldData;

        const newReactionCount = (oldData.reaction_count || 0) + 1;
        const newReactionWeightsSum = (
          BigInt(oldData.reaction_weights_sum || '0') +
          BigInt(reaction.voting_weight || '0')
        ).toString();

        return {
          ...oldData,
          reaction_count: newReactionCount,
          reaction_weights_sum: newReactionWeightsSum,
          reactions: [...(oldData.reactions || []), reaction],
        };
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
