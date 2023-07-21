import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Comment from 'models/Comment';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import useFetchCommentsQuery from './fetchComments';

interface ToggleCommentSpamStatusProps {
  chainId: string
  commentId: number;
  isSpam: boolean;
}

const toggleCommentSpamStatus = async ({
  chainId,
  commentId,
  isSpam
}: ToggleCommentSpamStatusProps) => {
  const method = isSpam ? 'put' : 'delete';
  return await axios[method](`${app.serverUrl()}/comments/${commentId}/spam`, {
    data: {
      jwt: app.user.jwt,
      chain_id: chainId,
    } as any,
  })
};

interface UseToggleCommentSpamStatusMutationProps {
  chainId: string
  threadId: number;
}

const useToggleCommentSpamStatusMutation = ({ chainId, threadId }: UseToggleCommentSpamStatusMutationProps) => {
  const queryClient = useQueryClient();
  const { data: comments } = useFetchCommentsQuery({
    chainId,
    threadId,
  })

  return useMutation({
    mutationFn: toggleCommentSpamStatus,
    onSuccess: async (response) => {
      // find the existing comment index and merge with existing comment
      const foundCommentIndex = comments.findIndex(x => x.id === response.data.result.id)
      const updatedComment = new Comment({ ...comments[foundCommentIndex], ...response.data.result })

      // update fetch comments query state with updated comment
      if (foundCommentIndex > -1) {
        const key = [ApiEndpoints.FETCH_COMMENTS, chainId, threadId]
        queryClient.cancelQueries({ queryKey: key });
        queryClient.setQueryData([...key],
          () => {
            const updatedComments = [...(comments || [])]
            updatedComments[foundCommentIndex] = updatedComment
            return [...updatedComments]
          }
        );
      }

      return updatedComment
    }
  });
};

export default useToggleCommentSpamStatusMutation;
