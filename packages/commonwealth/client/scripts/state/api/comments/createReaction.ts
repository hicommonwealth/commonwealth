import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import useFetchCommentReactionsQuery from './fetchReactions';

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
  commentId,
}: CreateReactionProps) => {
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
      comment_id: commentId,
    }
  );
};

const useCreateCommentReactionMutation = ({
  commentId,
  chainId,
}: Partial<CreateReactionProps>) => {
  const queryClient = useQueryClient();
  const { data: reactions } = useFetchCommentReactionsQuery({
    chainId,
    commentId: commentId,
  });

  return useMutation({
    mutationFn: createReaction,
    onSuccess: async (response) => {
      const reaction = response.data.result;

      // update fetch reaction query state
      const key = [
        ApiEndpoints.getCommentReactions(reaction.comment_id),
        chainId,
      ];
      queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData([...key], () => {
        const updatedReactions = [
          ...(reactions || []).filter((x) => x.id !== reaction.id),
          reaction,
        ];
        return updatedReactions;
      });
    },
  });
};

export default useCreateCommentReactionMutation;
