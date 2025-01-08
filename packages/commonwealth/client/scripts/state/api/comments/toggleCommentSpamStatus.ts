import Comment from 'models/Comment';
import { IUniqueId } from 'models/interfaces';
import { trpc } from 'utils/trpcClient';
import { updateThreadInAllCaches } from '../threads/helpers/cache';

interface UseToggleCommentSpamStatusMutationProps {
  communityId: string;
  threadId: number;
}

const useToggleCommentSpamStatusMutation = ({
  communityId,
  threadId,
}: UseToggleCommentSpamStatusMutationProps) => {
  const utils = trpc.useUtils();

  return trpc.comment.setCommentSpam.useMutation({
    onSuccess: async (response) => {
      const comment = new Comment({
        ...response?.data?.result,
        community_id: communityId,
      });

      // reset comments cache state
      utils.comment.getComments.invalidate().catch(console.error);

      updateThreadInAllCaches(
        communityId,
        threadId,
        { recentComments: [comment as Comment<IUniqueId>] },
        'combineAndRemoveDups',
      );
    },
  });
};

export default useToggleCommentSpamStatusMutation;
