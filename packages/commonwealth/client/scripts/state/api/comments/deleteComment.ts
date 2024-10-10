import { useQueryClient } from '@tanstack/react-query';
import { trpc } from 'client/scripts/utils/trpcClient';
import Comment from 'models/Comment';
import { IUniqueId } from 'models/interfaces';
import { ApiEndpoints } from 'state/api/config';
import { useAuthModalStore } from '../../ui/modals';
import { updateThreadInAllCaches } from '../threads/helpers/cache';
import useFetchCommentsQuery from './fetchComments';

interface UseDeleteCommentMutationProps {
  communityId: string;
  threadId: number;
  existingNumberOfComments: number;
}

const useDeleteCommentMutation = ({
  communityId,
  threadId,
  existingNumberOfComments,
}: UseDeleteCommentMutationProps) => {
  const queryClient = useQueryClient();
  const { data: comments } = useFetchCommentsQuery({
    communityId,
    threadId,
  });

  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  return trpc.comment.deleteComment.useMutation({
    onSuccess: async (response) => {
      // Important: we render comments in a tree, if the deleted comment is a
      // leaf node, remove it, but if it has replies, then preserve it with
      // [deleted] msg.
      const softDeleted = {
        id: response.comment_id,
        deleted: true,
        text: '[deleted]',
        versionHistory: [],
        canvas_signed_data: response.canvas_signed_data,
        canvas_msg_id: response.canvas_msg_id,
      };

      // find the existing comment index
      const foundCommentIndex = comments.findIndex(
        (x) => x.id === softDeleted.id,
      );

      if (foundCommentIndex > -1) {
        const softDeletedComment = Object.assign(
          { ...comments[foundCommentIndex] },
          { ...softDeleted },
        );

        // update fetch comments query state
        const key = [ApiEndpoints.FETCH_COMMENTS, communityId, threadId];
        queryClient.cancelQueries({ queryKey: key });
        queryClient.setQueryData(key, () => {
          const updatedComments = [...(comments || [])];
          updatedComments[foundCommentIndex] = softDeletedComment;
          return [...updatedComments];
        });
      }
      updateThreadInAllCaches(communityId, threadId, {
        numberOfComments: existingNumberOfComments - 1 || 0,
      });
      updateThreadInAllCaches(
        communityId,
        threadId,
        {
          recentComments: [{ id: softDeleted.id }] as Comment<IUniqueId>[],
        },
        'removeFromExisting',
      );
      return softDeleted;
    },
    onError: (error) => checkForSessionKeyRevalidationErrors(error),
  });
};

export default useDeleteCommentMutation;
