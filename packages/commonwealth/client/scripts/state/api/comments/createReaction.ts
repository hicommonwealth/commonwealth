import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { modelReactionCountFromServer } from 'controllers/server/comments';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import useFetchCommentReactionsQuery from './fetchReaction';

interface CreateReactionProps {
  address: string;
  reactionType?: 'like';
  chainId: string;
  commentId: number;
}

const createReaction = async ({
  address,
  reactionType = 'like',
  chainId,
  commentId
}: CreateReactionProps) => {
  // TODO: use canvas id
  const {
    session = null,
    action = null,
    hash = null,
  } = await app.sessions.signCommentReaction({
    comment_id: commentId,
    like: reactionType === 'like',
  });

  return await axios.post(
    `${app.serverUrl()}/comments/${commentId}/reactions`,
    {
      author_chain: app.user.activeAccount.chain.id,
      chain: chainId,
      address,
      reaction: reactionType,
      jwt: app.user.jwt,
      canvas_action: action,
      canvas_session: session,
      canvas_hash: hash,
      comment_id: commentId
    }
  );
};

const useCreateCommentReactionMutation = ({ commentId, chainId }: Partial<CreateReactionProps>) => {
  const queryClient = useQueryClient();
  const { data: reactions } = useFetchCommentReactionsQuery({
    chainId,
    commentId: commentId,
  })

  return useMutation({
    mutationFn: createReaction,
    onSuccess: async (response) => {
      const reaction = response.data.result;

      // update fetch reaction query state
      const key = [ApiEndpoints.getCommentReactions(reaction.comment_id), chainId]
      queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData([...key],
        () => {
          const updatedReactions = [...(reactions || []).filter(x => x.id !== reaction.id), reaction]
          return updatedReactions
        }
      );

      // TODO: this state below would be stored in comments react query state when we migrate the
      // whole comment controller from current state to react query (there is a good chance we can
      // remove this entirely)
      const reactionCount = app.comments.reactionCountsStore.getByPost(reaction);

      if (!reactionCount) {
        const { thread_id, proposal_id, comment_id } = reaction;
        const id = app.comments.reactionCountsStore.getIdentifier({
          threadId: thread_id,
          proposalId: proposal_id,
          commentId: comment_id,
        });
        app.comments.reactionCountsStore.add(modelReactionCountFromServer({
          id,
          thread_id,
          proposal_id,
          comment_id,
          has_reacted: true,
          like: 1,
        }));
      } else {
        app.comments.reactionCountsStore.update({
          ...reactionCount,
          likes: reactionCount.likes + 1,
          hasReacted: true,
        });
      }
    },
  });
};

export default useCreateCommentReactionMutation;
