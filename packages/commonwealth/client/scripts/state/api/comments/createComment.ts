import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { signComment } from 'client/scripts/controllers/server/sessions';
import Comment from 'models/Comment';
import { toCanvasSignedDataApiArgs } from 'shared/canvas/types';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import { UserProfile } from '../../../models/MinimumProfile';
import { updateThreadInAllCaches } from '../threads/helpers/cache';
import useFetchCommentsQuery from './fetchComments';

interface CreateCommentProps {
  profile: UserProfile;
  threadId: number;
  communityId: string;
  unescapedText: string;
  parentCommentId: number;
  existingNumberOfComments: number;
}

const createComment = async ({
  communityId,
  profile,
  threadId,
  unescapedText,
  parentCommentId = null,
}: CreateCommentProps) => {
  const canvasSignedData = await signComment(profile.address, {
    thread_id: threadId,
    body: unescapedText,
    parent_comment_id: parentCommentId,
  });

  const response = await axios.post(
    `${app.serverUrl()}/threads/${threadId}/comments`,
    {
      author_community_id: communityId,
      community_id: communityId,
      address: profile.address,
      parent_id: parentCommentId,
      text: encodeURIComponent(unescapedText),
      jwt: app.user.jwt,
      ...(await toCanvasSignedDataApiArgs(canvasSignedData)),
    },
  );

  response.data.result.Address.User = {
    Profiles: [profile],
  };

  return new Comment(response.data.result);
};

const useCreateCommentMutation = ({
  communityId,
  threadId,
  existingNumberOfComments = 0,
}: Partial<CreateCommentProps>) => {
  const queryClient = useQueryClient();
  const { data: comments } = useFetchCommentsQuery({
    communityId,
    threadId,
  });

  return useMutation({
    mutationFn: createComment,
    onSuccess: async (newComment) => {
      // update fetch comments query state
      const key = [ApiEndpoints.FETCH_COMMENTS, communityId, threadId];
      queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData(key, () => {
        return [...comments, newComment];
      });
      updateThreadInAllCaches(communityId, threadId, {
        numberOfComments: existingNumberOfComments + 1,
      });
      return newComment;
    },
  });
};

export default useCreateCommentMutation;
