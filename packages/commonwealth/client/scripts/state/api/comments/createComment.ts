import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { updateLastVisited } from 'controllers/app/login';
import Comment from 'models/Comment';
import Thread from 'models/Thread';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import useFetchCommentsQuery from './fetchComments';

interface CreateCommentProps {
  address: string;
  threadId: number,
  chainId: string;
  unescapedText: string,
  parentCommentId: any,
  attachments?: string[]
}

const createComment = async ({
  chainId,
  address,
  threadId,
  attachments,
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
      // chain_entity_id: chainEntity?.id,
      'attachments[]': attachments,
      text: encodeURIComponent(unescapedText),
      jwt: app.user.jwt,
      canvas_action: action,
      canvas_session: session,
      canvas_hash: hash,
    }
  );

  return new Comment(response.data.result)
};

const useCreateCommentMutation = ({ chainId, threadId }: Partial<CreateCommentProps>) => {
  const queryClient = useQueryClient();
  const { data: comments } = useFetchCommentsQuery({
    chainId,
    threadId,
  })

  return useMutation({
    mutationFn: createComment,
    onSuccess: async (newComment) => {
      // update fetch comments query state
      const key = [ApiEndpoints.FETCH_COMMENTS, chainId, threadId]
      queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData([...key],
        () => {
          const updatedComments = [...(comments || []).filter(x => x.id !== newComment.id), newComment]
          return updatedComments
        }
      );

      // TODO: these types of async calls should also have a dedicated react query handler
      // update last visisted
      updateLastVisited(app.chain.meta, true)

      // TODO: this state below would be stored in threads react query state when we migrate the
      // whole threads controller from current state to react query (there is a good chance we can
      // remove this entirely)
      // increment thread count in thread store
      const thread = app.threads.getById(threadId);
      if (thread) {
        app.threads.updateThreadInStore(
          new Thread({
            ...thread,
            numberOfComments: thread.numberOfComments + 1,
          })
        );
      }

      return newComment
    },
  });
};

export default useCreateCommentMutation;
