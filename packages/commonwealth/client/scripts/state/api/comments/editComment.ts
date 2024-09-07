import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { useQueryClient } from '@tanstack/react-query';
import { trpc } from 'client/scripts/utils/trpcClient';
import { signComment } from 'controllers/server/sessions';
import Comment from 'models/Comment';
import { ApiEndpoints } from 'state/api/config';
import { UserProfile } from '../../../models/MinimumProfile';
import { useAuthModalStore } from '../../ui/modals';
import { userStore } from '../../ui/user';
import { updateThreadInAllCaches } from '../threads/helpers/cache';
import useFetchCommentsQuery from './fetchComments';

interface EditCommentProps {
  profile: UserProfile;
  communityId: string;
  parentCommentId: number | null;
  threadId: number;
  commentId: number;
  updatedBody: string;
}

export const buildUpdateCommentInput = async ({
  profile,
  communityId,
  parentCommentId,
  threadId,
  commentId,
  updatedBody,
}: EditCommentProps) => {
  const canvasSignedData = await signComment(profile.address, {
    thread_id: threadId,
    body: updatedBody,
    parent_comment_id: parentCommentId,
  });

  return {
    address: profile.address,
    author_community_id: communityId,
    comment_id: commentId,
    community_id: communityId,
    text: encodeURIComponent(updatedBody),
    jwt: userStore.getState().jwt,
    ...toCanvasSignedDataApiArgs(canvasSignedData),
  };
};

interface UseEditCommentMutationProps {
  communityId: string;
  threadId: number;
}

const useEditCommentMutation = ({
  communityId,
  threadId,
}: UseEditCommentMutationProps) => {
  const queryClient = useQueryClient();
  const { data: comments } = useFetchCommentsQuery({
    communityId,
    threadId,
  });

  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  return trpc.comment.updateComment.useMutation({
    onSuccess: async (updatedComment) => {
      const comment = new Comment(updatedComment as any);
      console.log({ comment, updatedComment });

      // update fetch comments query state with updated comment
      const key = [ApiEndpoints.FETCH_COMMENTS, communityId, threadId];
      queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData([...key], () => {
        // find the existing comment index, and return updated comment in its place
        return comments.map((x) => (x.id === comment.id ? comment : x));
      });

      updateThreadInAllCaches(
        communityId,
        threadId,
        { recentComments: [comment] },
        'combineAndRemoveDups',
      );

      return comment;
    },
    onError: (error) => checkForSessionKeyRevalidationErrors(error),
  });
};

export default useEditCommentMutation;
