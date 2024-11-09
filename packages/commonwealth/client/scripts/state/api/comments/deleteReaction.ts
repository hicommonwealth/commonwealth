import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { useQueryClient } from '@tanstack/react-query';
import { trpc } from 'client/scripts/utils/trpcClient';
import { signDeleteCommentReaction } from 'controllers/server/sessions';
import { ApiEndpoints } from 'state/api/config';
import { useAuthModalStore } from '../../ui/modals';
import { userStore } from '../../ui/user';
import useFetchCommentsQuery from './fetchComments';

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
    comment_id: commentMsgId,
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

interface UseDeleteCommentReactionMutationProps {
  communityId: string;
  threadId: number;
  commentId: number;
}

const useDeleteCommentReactionMutation = ({
  threadId,
  commentId,
  communityId,
}: UseDeleteCommentReactionMutationProps) => {
  const queryClient = useQueryClient();
  const { data: comments } = useFetchCommentsQuery({
    communityId,
    threadId,
  });

  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  return trpc.thread.deleteReaction.useMutation({
    onSuccess: (deleted, variables) => {
      // update fetch comments query state
      if (deleted) {
        const key = [ApiEndpoints.FETCH_COMMENTS, communityId, threadId];
        queryClient.cancelQueries({ queryKey: key });
        queryClient.setQueryData(key, () => {
          const tempComments = [...comments];
          return tempComments.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                reactions: comment.reactions.filter(
                  (r) => r.id !== variables.reaction_id,
                ),
              };
            }
            return comment;
          });
        });
      }
    },
    onError: (error) => checkForSessionKeyRevalidationErrors(error),
  });
};

export default useDeleteCommentReactionMutation;
