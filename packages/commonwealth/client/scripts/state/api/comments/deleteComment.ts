import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Comment from 'models/Comment';
import { IUniqueId } from 'models/interfaces';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import { updateThreadInAllCaches } from '../threads/helpers/cache';
import useFetchCommentsQuery from './fetchComments';

interface DeleteCommentProps {
  address: string;
  communityId: string;
  canvasHash: string;
  commentId: number;
  existingNumberOfComments: number;
}

const deleteComment = async ({
  address,
  communityId,
  commentId,
  canvasHash,
}: DeleteCommentProps) => {
  const {
    session = null,
    action = null,
    hash = null,
  } = await app.sessions.signDeleteComment(app.user.activeAccount.address, {
    comment_id: canvasHash,
  });

  await axios.delete(`${app.serverUrl()}/comments/${commentId}`, {
    data: {
      jwt: app.user.jwt,
      address: address,
      community_id: communityId,
      author_community_id: communityId,
    },
  });

  // Important: we render comments in a tree, if the deleted comment is a
  // leaf node, remove it, but if it has replies, then preserve it with
  // [deleted] msg.
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
    },
  };
};

interface UseDeleteCommentMutationProps {
  communityId: string;
  threadId: number;
  existingNumberOfComments: number;
}

const useDeleteCommentMutation = ({
  communityId,
  threadId,
  existingNumberOfComments,
}: UseDeleteCommentMutationProps) => {
  const queryClient = useQueryClient();
  const { data: comments } = useFetchCommentsQuery({
    communityId,
    threadId,
  });

  return useMutation({
    mutationFn: deleteComment,
    onSuccess: async (response) => {
      // find the existing comment index
      const foundCommentIndex = comments.findIndex(
        (x) => x.id === response.softDeleted.id,
      );

      if (foundCommentIndex > -1) {
        const softDeletedComment = Object.assign(
          { ...comments[foundCommentIndex] },
          { ...response.softDeleted },
        );

        // update fetch comments query state
        const key = [ApiEndpoints.FETCH_COMMENTS, communityId, threadId];
        queryClient.cancelQueries({ queryKey: key });
        queryClient.setQueryData(key, () => {
          const updatedComments = [...(comments || [])];
          updatedComments[foundCommentIndex] = softDeletedComment;
          return [...updatedComments];
        });
      }
      updateThreadInAllCaches(communityId, threadId, {
        numberOfComments: existingNumberOfComments - 1 || 0,
      });
      updateThreadInAllCaches(
        communityId,
        threadId,
        {
          recentComments: [
            { id: response.softDeleted.id },
          ] as Comment<IUniqueId>[],
        },
        'removeFromExisting',
      );
      return response;
    },
  });
};

export default useDeleteCommentMutation;
