import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Comment from 'models/Comment';
import { IUniqueId } from 'models/interfaces';
import { SERVER_URL } from 'state/api/config';
import { trpc } from 'utils/trpcClient';
import { userStore } from '../../ui/user';
import { updateThreadInAllCaches } from '../threads/helpers/cache';

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
  const utils = trpc.useUtils();

  return useMutation({
    mutationFn: toggleCommentSpamStatus,
    // TODO: check if the type of response format would work for all caches
    // and wouldn't break anything
    onSuccess: async (response) => {
      // @ts-expect-error StrictNullChecks
      const comment = new Comment(response);

      // TODO: #8015 - make a generic util to apply cache
      // updates for comments in all possible key combinations
      // present in cache.
      utils.comment.getComments.invalidate();

      updateThreadInAllCaches(
        communityId,
        threadId,
        { recentComments: [comment as Comment<IUniqueId>] },
        'combineAndRemoveDups',
      );
    },
  });
};

export default useToggleCommentSpamStatusMutation;
