import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Reaction from 'models/Reaction';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import useFetchCommentsQuery from './fetchComments';

interface CreateReactionProps {
  address: string;
  reactionType?: 'like';
  chainId: string;
  threadId: number;
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
  threadId,
  commentId,
  chainId,
}: Partial<CreateReactionProps>) => {
  const queryClient = useQueryClient();
  const { data: comments } = useFetchCommentsQuery({
    chainId,
    threadId,
  });

  return useMutation({
    mutationFn: createReaction,
    onSuccess: async (response) => {
      const reaction = response.data.result;

      // update fetch comments query state
      const key = [ApiEndpoints.FETCH_COMMENTS, chainId, threadId];
      queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData(key, () => {
        const tempComments = [...comments];
        const commentToUpdate = tempComments.find((x) => x.id === commentId);
        commentToUpdate.reactions.push(new Reaction(reaction));
        return tempComments;
      });

      return reaction;
    },
  });
};

export default useCreateCommentReactionMutation;
