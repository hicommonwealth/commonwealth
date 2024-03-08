import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Reaction from 'models/Reaction';
import { toCanvasSignedDataApiArgs } from 'shared/canvas/types';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import useFetchCommentsQuery from './fetchComments';

interface CreateReactionProps {
  address: string;
  reactionType?: 'like';
  communityId: string;
  threadId: number;
  commentId: number;
}

const createReaction = async ({
  address,
  reactionType = 'like',
  communityId,
  commentId,
}: CreateReactionProps) => {
  const canvasSignedData = await app.sessions.signCommentReaction(address, {
    comment_id: commentId,
    like: reactionType === 'like',
  });

  return await axios.post(
    `${app.serverUrl()}/comments/${commentId}/reactions`,
    {
      author_community_id: app.user.activeAccount.community.id,
      community_id: communityId,
      address,
      reaction: reactionType,
      jwt: app.user.jwt,
      ...toCanvasSignedDataApiArgs(canvasSignedData),
      comment_id: commentId,
    },
  );
};

const useCreateCommentReactionMutation = ({
  threadId,
  commentId,
  communityId,
}: Partial<CreateReactionProps>) => {
  const queryClient = useQueryClient();
  const { data: comments } = useFetchCommentsQuery({
    communityId,
    threadId,
  });

  return useMutation({
    mutationFn: createReaction,
    onSuccess: async (response) => {
      const reaction = response.data.result;

      // update fetch comments query state
      const key = [ApiEndpoints.FETCH_COMMENTS, communityId, threadId];
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
