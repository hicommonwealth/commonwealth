import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Thread from 'models/Thread';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import useFetchCommentsQuery from './fetchComments';

interface DeleteCommentProps {
  address: string;
  chainId: string
  canvasHash: string
  commentId: number;
}

const deleteComment = async ({
  address,
  chainId,
  commentId,
  canvasHash,
}: DeleteCommentProps) => {
  const {
    session = null,
    action = null,
    hash = null,
  } = await app.sessions.signDeleteComment({
    comment_id: canvasHash,
  })

  await axios.delete(`${app.serverUrl()}/comments/${commentId}`, {
    data: {
      jwt: app.user.jwt,
      address: address,
      chain: chainId,
      author_chain: chainId
    },
  })

  // Important: we render comments in a tree, if this deleted comment was
  // the root comment of a tree, then we want to preserve the comment tree,
  // but in place of this deleted comment we will show the "[deleted]" msg.
  return {
    softDeleted: {
      id: commentId,
      deleted: true,
      text: '[deleted]',
      plaintext: '[deleted]',
      versionHistory: [],
      canvas_action: action,
      canvas_session: session,
      canvas_hash: hash,
    }
  }
};

interface UseDeleteCommentMutationProps {
  chainId: string
  threadId: number;
}

const useDeleteCommentMutation = ({ chainId, threadId }: UseDeleteCommentMutationProps) => {
  const queryClient = useQueryClient();
  const { data: comments } = useFetchCommentsQuery({
    chainId,
    threadId,
  })

  return useMutation({
    mutationFn: deleteComment,
    onSuccess: async (response) => {
      // find the existing comment index
      const foundCommentIndex = comments.findIndex(x => x.id === response.softDeleted.id)

      if (foundCommentIndex > -1) {
        const softDeletedComment = Object.assign({ ...comments[foundCommentIndex] }, { ...response.softDeleted })

        // update fetch comments query state
        const key = [ApiEndpoints.FETCH_COMMENTS, chainId, threadId]
        queryClient.cancelQueries({ queryKey: key });
        queryClient.setQueryData([...key],
          () => {
            const updatedComments = [...(comments || [])]
            updatedComments[foundCommentIndex] = { ...softDeletedComment }
            return [...updatedComments]
          }
        );
      }

      // TODO: this state below would be stored in threads react query state when we migrate the
      // whole threads controller from current state to react query (there is a good chance we can
      // remove this entirely)
      // increment thread count in thread store
      const thread = app.threads.getById(threadId);
      if (thread) {
        app.threads.updateThreadInStore(
          new Thread({
            ...thread,
            numberOfComments: thread.numberOfComments - 1,
          })
        );
      }

      return response
    }
  });
};

export default useDeleteCommentMutation;
