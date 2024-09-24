import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { trpc } from 'client/scripts/utils/trpcClient';
import { signDeleteThreadReaction } from 'controllers/server/sessions';
import app from 'state';
import { useAuthModalStore } from '../../ui/modals';
import { userStore } from '../../ui/user';
import { updateThreadInAllCaches } from './helpers/cache';

interface UseDeleteThreadReactionMutationProps {
  address: string;
  communityId: string;
  threadMsgId: string;
  threadId: number;
}

interface DeleteReactionProps extends UseDeleteThreadReactionMutationProps {
  reactionId: number;
}

export const buildDeleteThreadReactionInput = async ({
  address,
  communityId,
  threadMsgId,
  reactionId,
}: DeleteReactionProps) => {
  const canvasSignedData = await signDeleteThreadReaction(address, {
    thread_id: threadMsgId,
  });

  return {
    author_community_id: communityId,
    address: address,
    community_id: app.chain.id,
    reaction_id: reactionId,
    jwt: userStore.getState().jwt,
    ...toCanvasSignedDataApiArgs(canvasSignedData),
  };
};

const useDeleteThreadReactionMutation = ({
  communityId,
  threadId,
}: UseDeleteThreadReactionMutationProps) => {
  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  return trpc.thread.deleteReaction.useMutation({
    onSuccess: (deleted) => {
      updateThreadInAllCaches(
        communityId,
        threadId,
        {
          associatedReactions: [
            {
              id: deleted.reaction_id,
              type: 'like',
              voting_weight: 0,
              address: '',
              updated_at: '',
            },
          ],
        },
        'removeFromExisting',
      );
    },
    onError: (error) => checkForSessionKeyRevalidationErrors(error),
  });
};

export default useDeleteThreadReactionMutation;
