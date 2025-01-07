import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { AxiosError } from 'axios';
import { notifyError } from 'controllers/app/notifications';
import { signCommentReaction } from 'controllers/server/sessions';
import useUserOnboardingSliderMutationStore from 'state/ui/userTrainingCards';
import { trpc } from 'utils/trpcClient';
import { UserTrainingCardTypes } from 'views/components/UserTrainingSlider/types';
import { useAuthModalStore } from '../../ui/modals';
import useUserStore, { userStore } from '../../ui/user';

interface CreateReactionProps {
  address: string;
  reactionType?: 'like';
  communityId: string;
  threadId: number;
  commentId: number;
  commentMsgId: string;
}

export const buildCreateCommentReactionInput = async ({
  address,
  reactionType = 'like',
  communityId,
  commentId,
  commentMsgId,
}: CreateReactionProps) => {
  const canvasSignedData = await signCommentReaction(address, {
    comment_id: commentMsgId ?? null,
    like: reactionType === 'like',
  });

  return {
    author_community_id: userStore.getState().activeAccount?.community?.id,
    community_id: communityId,
    address,
    reaction: reactionType,
    jwt: userStore.getState().jwt,
    ...toCanvasSignedDataApiArgs(canvasSignedData),
    comment_id: commentId,
    comment_msg_id: commentMsgId ?? null,
  };
};

const useCreateCommentReactionMutation = () => {
  const utils = trpc.useUtils();
  const user = useUserStore();

  const { markTrainingActionAsComplete } =
    useUserOnboardingSliderMutationStore();

  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  return trpc.comment.createCommentReaction.useMutation({
    onSuccess: (newReaction) => {
      // reset comments cache state
      utils.comment.getComments.invalidate().catch(console.error);

      const userId = user.addresses?.[0]?.profile?.userId;
      userId &&
        markTrainingActionAsComplete(UserTrainingCardTypes.GiveUpvote, userId);

      return newReaction;
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.data?.error?.toLowerCase().includes('stake')) {
          notifyError('Buy stake in community to upvote comments');
        }
      }
      return checkForSessionKeyRevalidationErrors(error);
    },
  });
};

export default useCreateCommentReactionMutation;
