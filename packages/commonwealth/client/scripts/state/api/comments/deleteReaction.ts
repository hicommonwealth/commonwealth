import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import ReactionCount from 'models/ReactionCount';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import useFetchCommentReactionsQuery from './fetchReaction';

interface DeleteReactionProps {
  reactionCount: ReactionCount<any>
  canvasHash: string
  reactionId: number;
}

const deleteReaction = async ({
  reactionCount,
  canvasHash,
  reactionId
}: DeleteReactionProps) => {
  const {
    session = null,
    action = null,
    hash = null,
  } = await app.sessions.signDeleteCommentReaction({
    comment_id: canvasHash,
  })

  return await axios.delete(`${app.serverUrl()}/reactions/${reactionId}`, {
    data: {
      jwt: app.user.jwt,
      canvas_action: action,
      canvas_session: session,
      canvas_hash: hash,
    },
  }).then((r) => ({
    ...r,
    data: {
      ...r.data,
      result: {
        ...(r.data.result || {}),
        reactionCount,
        reactionId
      }
    }
  }));
};

interface IuseDeleteCommentReactionMutation {
  chainId: string;
  commentId: number;
}

const useDeleteCommentReactionMutation = ({ commentId, chainId }: IuseDeleteCommentReactionMutation) => {
  const queryClient = useQueryClient();
  const { data: reactions } = useFetchCommentReactionsQuery({
    chainId,
    commentId: commentId as number,
  })

  return useMutation({
    mutationFn: deleteReaction,
    onSuccess: async (response) => {
      const { reactionCount, reactionId } = response.data.result

      // update fetch reaction query state
      const key = [ApiEndpoints.getCommentReactions(commentId), chainId]
      queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData([...key],
        () => {
          const updatedReactions = [...(reactions || []).filter(x => x.id !== reactionId)]
          return updatedReactions
        }
      );

      // TODO: this state below would be stored in comments react query state when we migrate the
      // whole comment controller from current state to react query (there is a good chance we can
      // remove this entirely)
      app.comments.reactionCountsStore.update(reactionCount);
      if (reactionCount.likes === 0 && reactionCount.dislikes === 0) {
        app.comments.reactionCountsStore.remove(reactionCount);
      }
    }
  });
};

export default useDeleteCommentReactionMutation;
