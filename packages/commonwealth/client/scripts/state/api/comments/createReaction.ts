import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { notifyError } from 'client/scripts/controllers/app/notifications';
import { trpc } from 'client/scripts/utils/trpcClient';
import { signCommentReaction } from 'controllers/server/sessions';
import useUserOnboardingSliderMutationStore from 'state/ui/userTrainingCards';
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

const useCreateCommentReactionMutation = ({
  threadId,
  commentId,
  communityId,
}: Partial<CreateReactionProps>) => {
  const queryClient = useQueryClient();
  // TODO: fix cache updates
  const comments = [];
  // const { data: comments } = useFetchCommentsQuery({
  //   // @ts-expect-error StrictNullChecks
  //   communityId,
  //   // @ts-expect-error StrictNullChecks
  //   threadId,
  // });
  const user = useUserStore();

  const { markTrainingActionAsComplete } =
    useUserOnboardingSliderMutationStore();

  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  return trpc.comment.createCommentReaction.useMutation({
    onSuccess: (newReaction) => {
      // update fetch comments query state
      // const key = [ApiEndpoints.FETCH_COMMENTS, communityId, threadId];
      // queryClient.cancelQueries({ queryKey: key });
      // queryClient.setQueryData(key, () => {
      //   const tempComments = [...comments];
      //   const commentToUpdate = tempComments.find((x) => x.id === commentId);
      //   newReaction.Address!.User = {
      //     profile: commentToUpdate.profile,
      //   };
      //   // @ts-expect-error StrictNullChecks
      //   commentToUpdate.reactions.push(new Reaction(newReaction));
      //   return tempComments;
      // });

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
