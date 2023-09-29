import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import useFetchCommentsQuery from './fetchComments';

interface DeleteReactionProps {
  chainId: string;
  address: string;
  canvasHash: string;
  reactionId: number;
}

const deleteReaction = async ({
  chainId,
  address,
  canvasHash,
  reactionId,
}: DeleteReactionProps) => {
  const {
    session = null,
    action = null,
    hash = null,
  } = await app.sessions.signDeleteCommentReaction(address, {
    comment_id: canvasHash,
  });
  return await axios
    .delete(`${app.serverUrl()}/reactions/${reactionId}`, {
      data: {
        author_chain: chainId,
        address: address,
        jwt: app.user.jwt,
        canvas_action: action,
        canvas_session: session,
        canvas_hash: hash,
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
  chainId: string;
  threadId: number;
  commentId: number;
}

const useDeleteCommentReactionMutation = ({
  threadId,
  commentId,
  chainId,
}: UseDeleteCommentReactionMutationProps) => {
  const queryClient = useQueryClient();
  const { data: comments } = useFetchCommentsQuery({
    chainId,
    threadId,
  });

  return useMutation({
    mutationFn: deleteReaction,
    onSuccess: async (response) => {
      const { reactionId } = response.data.result;

      // update fetch comments query state
      const key = [ApiEndpoints.FETCH_COMMENTS, chainId, threadId];
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
  });
};

export default useDeleteCommentReactionMutation;
