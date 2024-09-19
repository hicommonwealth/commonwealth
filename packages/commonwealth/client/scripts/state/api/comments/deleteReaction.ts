import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { signDeleteCommentReaction } from 'controllers/server/sessions';
import { ApiEndpoints, SERVER_URL } from 'state/api/config';
import { useAuthModalStore } from '../../ui/modals';
import { userStore } from '../../ui/user';
import useFetchCommentsQuery from './fetchComments';

interface DeleteReactionProps {
  address: string;
  communityId: string;
  commentMsgId: string;
  reactionId: number;
}

const deleteReaction = async ({
  address,
  communityId,
  commentMsgId,
  reactionId,
}: DeleteReactionProps) => {
  const canvasSignedData = await signDeleteCommentReaction(address, {
    comment_id: commentMsgId,
  });

  return await axios
    .delete(`${SERVER_URL}/reactions/${reactionId}`, {
      data: {
        author_community_id: communityId,
        address: address,
        community_id: communityId,
        jwt: userStore.getState().jwt,
        ...toCanvasSignedDataApiArgs(canvasSignedData),
      },
    })
    .then((r) => ({
      ...r,
      data: {
        ...r.data,
        result: {
          ...(r.data.result || {}),
          reactionId,
        },
      },
    }));
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

  return useMutation({
    mutationFn: deleteReaction,
    onSuccess: async (response) => {
      const { reactionId } = response.data.result;

      // update fetch comments query state
      const key = [ApiEndpoints.FETCH_COMMENTS, communityId, threadId];
      queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData(key, () => {
        const tempComments = [...comments];
        return tempComments.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              reactions: comment.reactions.filter((r) => r.id !== reactionId),
            };
          }
          return comment;
        });
      });
    },
    onError: (error) => checkForSessionKeyRevalidationErrors(error),
  });
};

export default useDeleteCommentReactionMutation;
