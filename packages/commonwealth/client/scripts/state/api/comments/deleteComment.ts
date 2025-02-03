import Comment from 'models/Comment';
import { IUniqueId } from 'models/interfaces';
import { trpc } from 'utils/trpcClient';
import { useAuthModalStore } from '../../ui/modals';
import { updateThreadInAllCaches } from '../threads/helpers/cache';

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
  const utils = trpc.useUtils();

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

      // reset comments cache state
      utils.comment.getComments.invalidate().catch(console.error);

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
