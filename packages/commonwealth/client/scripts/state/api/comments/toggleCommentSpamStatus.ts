import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { SERVER_URL } from 'state/api/config';
import { userStore } from '../../ui/user';

interface ToggleCommentSpamStatusProps {
  communityId: string;
  commentId: number;
  isSpam: boolean;
  address: string;
}

const toggleCommentSpamStatus = async ({
  communityId,
  commentId,
  isSpam,
  address,
}: ToggleCommentSpamStatusProps) => {
  const method = isSpam ? 'put' : 'delete';
  const body = {
    jwt: userStore.getState().jwt,
    chain_id: communityId,
    address: address,
    author_chain: communityId,
  };
  return await axios[method](
    `${SERVER_URL}/comments/${commentId}/spam`,
    isSpam ? body : ({ data: { ...body } } as any),
  );
};

interface UseToggleCommentSpamStatusMutationProps {
  communityId: string;
  threadId: number;
}

const useToggleCommentSpamStatusMutation = ({
  communityId,
  threadId,
}: UseToggleCommentSpamStatusMutationProps) => {
  const queryClient = useQueryClient();
  // TODO: fix cache
  const comments = [];
  // const { data: comments } = useFetchCommentsQuery({
  //   communityId,
  //   threadId,
  // });

  return useMutation({
    mutationFn: toggleCommentSpamStatus,
    onSuccess: async (response) => {
      // // find the existing comment index and merge with existing comment
      // const foundCommentIndex = comments.findIndex(
      //   (x) => x.id === response.data.result.id,
      // );
      // const updatedComment = comments[foundCommentIndex];
      // const { marked_as_spam_at } = response.data.result;
      // updatedComment.markedAsSpamAt = marked_as_spam_at
      //   ? moment(marked_as_spam_at)
      //   : null;
      // // update fetch comments query state with updated comment
      // if (foundCommentIndex > -1) {
      //   const key = [ApiEndpoints.FETCH_COMMENTS, communityId, threadId];
      //   queryClient.cancelQueries({ queryKey: key });
      //   queryClient.setQueryData([...key], () => {
      //     const updatedComments = [...(comments || [])];
      //     updatedComments[foundCommentIndex] = updatedComment;
      //     return [...updatedComments];
      //   });
      // }
      // updateThreadInAllCaches(
      //   communityId,
      //   threadId,
      //   { recentComments: [updatedComment] },
      //   'combineAndRemoveDups',
      // );
      // return updatedComment;
    },
  });
};

export default useToggleCommentSpamStatusMutation;
