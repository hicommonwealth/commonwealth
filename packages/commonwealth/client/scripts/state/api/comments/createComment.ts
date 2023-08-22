import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { updateLastVisited } from 'controllers/app/login';
import Comment from 'models/Comment';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import { updateThreadInAllCaches } from '../threads/helpers/cache';
import useFetchCommentsQuery from './fetchComments';

interface CreateCommentProps {
  address: string;
  threadId: number;
  chainId: string;
  unescapedText: string;
  parentCommentId: number;
  existingNumberOfComments: number;
}

const createComment = async ({
  chainId,
  address,
  threadId,
  unescapedText,
  parentCommentId = null,
}: CreateCommentProps) => {
  const {
    session = null,
    action = null,
    hash = null,
  } = await app.sessions.signComment({
    thread_id: threadId,
    body: unescapedText,
    parent_comment_id: parentCommentId,
  });

  const response = await axios.post(
    `${app.serverUrl()}/threads/${threadId}/comments`,
    {
      author_chain: chainId,
      chain: chainId,
      address: address,
      parent_id: parentCommentId,
      text: encodeURIComponent(unescapedText),
      jwt: app.user.jwt,
      canvas_action: action,
      canvas_session: session,
      canvas_hash: hash,
    }
  );

  return new Comment(response.data.result);
};

const useCreateCommentMutation = ({
  chainId,
  threadId,
  existingNumberOfComments = 0,
}: Partial<CreateCommentProps>) => {
  const queryClient = useQueryClient();
  const { data: comments } = useFetchCommentsQuery({
    chainId,
    threadId,
  });

  return useMutation({
    mutationFn: createComment,
    onSuccess: async (newComment) => {
      // update fetch comments query state
      const key = [ApiEndpoints.FETCH_COMMENTS, chainId, threadId];
      queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData(key, () => {
        return [...comments, newComment];
      });

      // TODO: these types of async calls should also have a dedicated react query handler
      // update last visisted
      updateLastVisited(app.chain.meta, true);

      updateThreadInAllCaches(chainId, threadId, {
        numberOfComments: existingNumberOfComments + 1,
      });
      return newComment;
    },
  });
};

export default useCreateCommentMutation;
