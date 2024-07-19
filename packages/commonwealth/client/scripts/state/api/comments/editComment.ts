import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { signComment } from 'controllers/server/sessions';
import Comment from 'models/Comment';
import app from 'state';
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

const editComment = async ({
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

  const response = await axios.patch(
    `${app.serverUrl()}/comments/${commentId}`,
    {
      address: profile.address,
      author_community_id: communityId,
      id: commentId,
      community_id: communityId,
      body: encodeURIComponent(updatedBody),
      jwt: userStore.getState().jwt,
      ...toCanvasSignedDataApiArgs(canvasSignedData),
    },
  );

  response.data.result.Address.User = {
    profile,
  };

  return new Comment(response.data.result);
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

  return useMutation({
    mutationFn: editComment,
    onSuccess: async (updatedComment) => {
      // update fetch comments query state with updated comment
      const key = [ApiEndpoints.FETCH_COMMENTS, communityId, threadId];
      queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData([...key], () => {
        // find the existing comment index, and return updated comment in its place
        return comments.map((x) =>
          x.id === updatedComment.id ? updatedComment : x,
        );
      });

      updateThreadInAllCaches(
        communityId,
        threadId,
        { recentComments: [updatedComment] },
        'combineAndRemoveDups',
      );

      return updatedComment;
    },
    onError: (error) => checkForSessionKeyRevalidationErrors(error),
  });
};

export default useEditCommentMutation;
