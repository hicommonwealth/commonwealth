import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { signDeleteCommentReaction } from 'client/scripts/controllers/server/sessions';
import { toCanvasSignedDataApiArgs } from 'shared/canvas/types';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import useFetchCommentsQuery from './fetchComments';

interface DeleteReactionProps {
  communityId: string;
  address: string;
  canvasHash: string;
  reactionId: number;
}

const deleteReaction = async ({
  communityId,
  address,
  canvasHash,
  reactionId,
}: DeleteReactionProps) => {
  const canvasSignedData = await signDeleteCommentReaction(address, {
    comment_id: canvasHash,
  });
  return await axios
    .delete(`${app.serverUrl()}/reactions/${reactionId}`, {
      data: {
        author_community_id: communityId,
        address: address,
        community_id: communityId,
        jwt: app.user.jwt,
        ...(await toCanvasSignedDataApiArgs(canvasSignedData)),
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
  });
};

export default useDeleteCommentReactionMutation;
