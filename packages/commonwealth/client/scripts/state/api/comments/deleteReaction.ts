import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { signDeleteCommentReaction } from 'controllers/server/sessions';
import { trpc } from 'utils/trpcClient';
import { useAuthModalStore } from '../../ui/modals';
import { userStore } from '../../ui/user';

interface DeleteReactionProps {
  address: string;
  communityId: string;
  commentMsgId: string;
  reactionId: number;
}

export const buildDeleteCommentReactionInput = async ({
  address,
  communityId,
  commentMsgId,
  reactionId,
}: DeleteReactionProps) => {
  const canvasSignedData = await signDeleteCommentReaction(address, {
    comment_id: commentMsgId ?? null,
  });
  return {
    author_community_id: communityId,
    address: address,
    community_id: communityId,
    reaction_id: reactionId,
    jwt: userStore.getState().jwt,
    ...toCanvasSignedDataApiArgs(canvasSignedData),
  };
};

const useDeleteCommentReactionMutation = () => {
  const utils = trpc.useUtils();

  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  return trpc.thread.deleteReaction.useMutation({
    onSuccess: () => {
      // TODO: https://github.com/hicommonwealth/commonwealth/issues/10461
      // make a generic util to apply cache updates for comments in all
      // possible key combinations present in cache.
      utils.comment.getComments.invalidate().catch(console.error);
    },
    onError: (error) => checkForSessionKeyRevalidationErrors(error),
  });
};

export default useDeleteCommentReactionMutation;
