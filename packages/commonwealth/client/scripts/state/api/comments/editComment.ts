import ipldDagJson from '@ipld/dag-json';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Comment from 'models/Comment';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import useFetchCommentsQuery from './fetchComments';

interface EditCommentProps {
  address: string;
  communityId: string;
  parentCommentId: number | null;
  threadId: number;
  commentId: number;
  updatedBody: string;
}

const editComment = async ({
  address,
  communityId,
  parentCommentId,
  threadId,
  commentId,
  updatedBody,
}: EditCommentProps) => {
  const {
    sessionMessage,
    sessionMessageSignature,
    actionMessage,
    actionMessageSignature,
  } = await app.sessions.signComment(app.user.activeAccount.address, {
    thread_id: threadId,
    body: updatedBody,
    parent_comment_id: parentCommentId,
  });

  const response = await axios.patch(
    `${app.serverUrl()}/comments/${commentId}`,
    {
      address: address,
      author_community_id: communityId,
      id: commentId,
      community_id: communityId,
      body: encodeURIComponent(updatedBody),
      jwt: app.user.jwt,
      canvas_action_message: actionMessage
        ? ipldDagJson.stringify(ipldDagJson.encode(actionMessage))
        : null,
      canvas_action_message_signature: actionMessageSignature
        ? ipldDagJson.stringify(ipldDagJson.encode(actionMessageSignature))
        : null,
      canvas_session_message: sessionMessage
        ? ipldDagJson.stringify(ipldDagJson.encode(sessionMessage))
        : null,
      canvas_session_message_signature: sessionMessageSignature
        ? ipldDagJson.stringify(ipldDagJson.encode(sessionMessageSignature))
        : null,
    },
  );

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

      return updatedComment;
    },
  });
};

export default useEditCommentMutation;
