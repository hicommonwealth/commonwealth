import { useQueryClient } from '@tanstack/react-query';
import { trpc } from 'client/scripts/utils/trpcClient';
import moment from 'moment';
import { ApiEndpoints } from 'state/api/config';
import { updateThreadInAllCaches } from '../threads/helpers/cache';
import useFetchCommentsQuery from './fetchComments';

interface UseToggleCommentSpamStatusMutationProps {
  communityId: string;
  threadId: number;
}

const useToggleCommentSpamStatusMutation = ({
  communityId,
  threadId,
}: UseToggleCommentSpamStatusMutationProps) => {
  const queryClient = useQueryClient();
  const { data: comments } = useFetchCommentsQuery({
    communityId,
    threadId,
  });

  return trpc.comment.setCommentSpam.useMutation({
    onSuccess: async (response) => {
      // find the existing comment index and merge with existing comment
      const foundCommentIndex = comments.findIndex((x) => x.id === response.id);
      const updatedComment = comments[foundCommentIndex];
      const { marked_as_spam_at } = response;
      updatedComment.markedAsSpamAt = marked_as_spam_at
        ? moment(marked_as_spam_at)
        : null;

      // update fetch comments query state with updated comment
      if (foundCommentIndex > -1) {
        const key = [ApiEndpoints.FETCH_COMMENTS, communityId, threadId];
        queryClient.cancelQueries({ queryKey: key });
        queryClient.setQueryData([...key], () => {
          const updatedComments = [...(comments || [])];
          updatedComments[foundCommentIndex] = updatedComment;
          return [...updatedComments];
        });
      }

      updateThreadInAllCaches(
        communityId,
        threadId,
        { recentComments: [updatedComment] },
        'combineAndRemoveDups',
      );

      return updatedComment;
    },
  });
};

export default useToggleCommentSpamStatusMutation;
