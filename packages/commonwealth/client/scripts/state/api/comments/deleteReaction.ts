import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import useFetchCommentReactionsQuery from './fetchReactions';

interface DeleteReactionProps {
  canvasHash: string;
  reactionId: number;
}

const deleteReaction = async ({
  canvasHash,
  reactionId,
}: DeleteReactionProps) => {
  const {
    session = null,
    action = null,
    hash = null,
  } = await app.sessions.signDeleteCommentReaction({
    comment_id: canvasHash,
  });

  return await axios
    .delete(`${app.serverUrl()}/reactions/${reactionId}`, {
      data: {
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
  commentId: number;
}

const useDeleteCommentReactionMutation = ({
  commentId,
  chainId,
}: UseDeleteCommentReactionMutationProps) => {
  const queryClient = useQueryClient();
  const { data: reactions } = useFetchCommentReactionsQuery({
    chainId,
    commentId: commentId as number,
  });

  return useMutation({
    mutationFn: deleteReaction,
    onSuccess: async (response) => {
      const { reactionId } = response.data.result;

      // update fetch reaction query state
      const key = [ApiEndpoints.getCommentReactions(commentId), chainId];
      queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData(key, () => {
        const updatedReactions = [
          ...(reactions || []).filter((x) => x.id !== reactionId),
        ];
        return updatedReactions;
      });
    },
  });
};

export default useDeleteCommentReactionMutation;
