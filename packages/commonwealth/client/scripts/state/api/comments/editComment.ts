import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Comment from 'models/Comment';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import useFetchCommentsQuery from './fetchComments';

interface EditCommentProps {
  address: string;
  chainId: string
  parentCommentId: number | null,
  threadId: number;
  commentId: number;
  updatedBody: string;
}

const editComment = async ({
  address,
  chainId,
  parentCommentId,
  threadId,
  commentId,
  updatedBody,
}: EditCommentProps) => {
  const {
    session = null,
    action = null,
    hash = null,
  } = await app.sessions.signComment({
    thread_id: threadId,
    body: updatedBody,
    parent_comment_id: parentCommentId,
  })

  const response = await axios.patch(`${app.serverUrl()}/comments/${commentId}`, {
    address: address,
    author_chain: chainId,
    id: commentId,
    chain: chainId,
    body: encodeURIComponent(updatedBody),
    jwt: app.user.jwt,
    canvas_action: action,
    canvas_session: session,
    canvas_hash: hash,
  })

  return new Comment(response.data.result)
};

interface UseEditCommentMutationProps {
  chainId: string
  threadId: number;
}

const useEditCommentMutation = ({ chainId, threadId }: UseEditCommentMutationProps) => {
  const queryClient = useQueryClient();
  const { data: comments } = useFetchCommentsQuery({
    chainId,
    threadId,
  })

  return useMutation({
    mutationFn: editComment,
    onSuccess: async (updatedComment) => {
      // find the existing comment index
      const foundCommentIndex = comments.findIndex(x => x.id === updatedComment.id)

      // update fetch comments query state with updated comment
      if (foundCommentIndex > -1) {
        const key = [ApiEndpoints.FETCH_COMMENTS, chainId, threadId]
        queryClient.cancelQueries({ queryKey: key });
        queryClient.setQueryData([...key],
          () => {
            const updatedComments = [...(comments || [])];
            updatedComments[foundCommentIndex] = updatedComment;
            return updatedComments;
          }
        );
      }

      return updatedComment
    }
  });
};

export default useEditCommentMutation;
