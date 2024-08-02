import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { signDeleteThreadReaction } from 'controllers/server/sessions';
import app from 'state';
import { useAuthModalStore } from '../../ui/modals';
import { userStore } from '../../ui/user';
import { updateThreadInAllCaches } from './helpers/cache';

interface UseDeleteThreadReactionMutationProps {
  communityId: string;
  address: string;
  threadId: number;
  threadMsgId: string;
}

interface DeleteReactionProps extends UseDeleteThreadReactionMutationProps {
  reactionId: number;
}

const deleteReaction = async ({
  communityId,
  address,
  reactionId,
  threadId,
  threadMsgId,
}: DeleteReactionProps) => {
  const canvasSignedData = await signDeleteThreadReaction(address, {
    thread_id: threadMsgId,
  });

  const response = await axios.delete(
    `${app.serverUrl()}/reactions/${reactionId}`,
    {
      data: {
        author_community_id: communityId,
        address: address,
        community_id: app.chain.id,
        jwt: userStore.getState().jwt,
        ...toCanvasSignedDataApiArgs(canvasSignedData),
      },
    },
  );

  return {
    ...response,
    data: {
      ...response.data,
      result: {
        thread_id: threadId,
        reaction_id: reactionId,
      },
    },
  };
};

const useDeleteThreadReactionMutation = ({
  communityId,
  threadId,
}: UseDeleteThreadReactionMutationProps) => {
  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  return useMutation({
    mutationFn: deleteReaction,
    onSuccess: async (response) => {
      updateThreadInAllCaches(
        communityId,
        threadId,
        {
          associatedReactions: [
            { id: response.data.result.reaction_id },
          ] as any,
        },
        'removeFromExisting',
      );
    },
    onError: (error) => checkForSessionKeyRevalidationErrors(error),
  });
};

export default useDeleteThreadReactionMutation;
