import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { signUpdateComment } from 'controllers/server/sessions';
import Comment from 'models/Comment';
import { ApiEndpoints, SERVER_URL } from 'state/api/config';
import { UserProfile } from '../../../models/MinimumProfile';
import { useAuthModalStore } from '../../ui/modals';
import { userStore } from '../../ui/user';
import { updateThreadInAllCaches } from '../threads/helpers/cache';
import useFetchCommentsQuery from './fetchComments';

interface EditCommentProps {
  profile: UserProfile;
  communityId: string;
  commentId: number;
  commentMsgId: string;
  updatedBody: string;
}

const editComment = async ({
  profile,
  communityId,
  commentId,
  commentMsgId,
  updatedBody,
}: EditCommentProps) => {
  const canvasSignedData = await signUpdateComment(profile.address, {
    comment_id: commentMsgId,
    body: updatedBody,
  });

  const response = await axios.patch(`${SERVER_URL}/comments/${commentId}`, {
    address: profile.address,
    author_community_id: communityId,
    id: commentId,
    community_id: communityId,
    body: encodeURIComponent(updatedBody),
    jwt: userStore.getState().jwt,
    ...toCanvasSignedDataApiArgs(canvasSignedData),
  });

  response.data.result.Address.User = {
    profile,
  };

  return new Comment({ community_id: undefined, ...response.data.result });
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
