import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { signDeleteCommentReaction } from 'controllers/server/sessions';
import { trpc } from 'utils/trpcClient';
import { useAuthModalStore } from '../../ui/modals';
import { userStore } from '../../ui/user';
import { queryClient } from '../config';

interface DeleteReactionProps {
  address: string;
  communityId: string;
  commentMsgId: string;
  reactionId: number;
}

export const buildDeleteCommentReactionInput = async ({
  address,
  communityId,
  commentMsgId,
  reactionId,
}: DeleteReactionProps) => {
  const canvasSignedData = await signDeleteCommentReaction(address, {
    comment_id: commentMsgId ?? null,
  });
  return {
    author_community_id: communityId,
    address: address,
    community_id: communityId,
    reaction_id: reactionId,
    jwt: userStore.getState().jwt,
    ...toCanvasSignedDataApiArgs(canvasSignedData),
  };
};

const useDeleteCommentReactionMutation = () => {
  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  return trpc.thread.deleteReaction.useMutation({
    onSuccess: (_, variables) => {
      // update all comment caches and remove this reaction
      const queryCache = queryClient.getQueryCache();
      const commentKeys = queryCache
        .getAll()
        .map((cache) => cache.queryKey)
        .filter(
          (key) =>
            Array.isArray(key[0]) &&
            key[0][0] === 'comment' &&
            key[0][1] === 'getComments',
        );
      commentKeys.map((key) => {
        const data: any = queryClient.getQueryData(key);

        data.pages = [...data.pages].map((p) => {
          const tempPage = { ...p };
          tempPage.results = [...tempPage.results];
          const foundComment = tempPage.results.find((c) =>
            c.reactions.find((r) => r.id === variables.reaction_id),
          );
          if (foundComment) {
            foundComment.reactions = [...foundComment.reactions].filter(
              (r) => r.id !== variables.reaction_id,
            );
          }
          return tempPage;
        });

        queryClient.setQueryData(key, () => {
          return data;
        });
      });
    },
    onError: (error) => checkForSessionKeyRevalidationErrors(error),
  });
};

export default useDeleteCommentReactionMutation;
