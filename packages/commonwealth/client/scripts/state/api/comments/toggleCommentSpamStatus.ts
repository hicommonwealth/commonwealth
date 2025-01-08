import Comment from 'models/Comment';
import { IUniqueId } from 'models/interfaces';
import moment from 'moment';
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
        ...response,
        id: response.id!,
        Address: response.Address!,
        author: response.Address!.address,
        community_id: communityId,
        reaction_weights_sum: response.reaction_weights_sum || '0',
        created_at: moment(response.created_at!),
        CommentVersionHistories: undefined,
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
