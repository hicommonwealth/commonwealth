import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toCanvasSignedDataApiArgs } from 'shared/canvas/types';
import app from 'state';
import { updateThreadInAllCaches } from './helpers/cache';

interface UseDeleteThreadReactionMutationProps {
  chainId: string;
  address: string;
  threadId: number;
}

interface DeleteReactionProps extends UseDeleteThreadReactionMutationProps {
  reactionId: number;
}

const deleteReaction = async ({
  chainId,
  address,
  reactionId,
  threadId,
}: DeleteReactionProps) => {
  const canvasSignedData = await app.sessions.signDeleteThreadReaction(
    address,
    {
      thread_id: threadId,
    },
  );

  const response = await axios.delete(
    `${app.serverUrl()}/reactions/${reactionId}`,
    {
      data: {
        author_community_id: chainId,
        address: address,
        community_id: app.chain.id,
        jwt: app.user.jwt,
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
  chainId,
  threadId,
}: UseDeleteThreadReactionMutationProps) => {
  return useMutation({
    mutationFn: deleteReaction,
    onSuccess: async (response) => {
      updateThreadInAllCaches(
        chainId,
        threadId,
        {
          associatedReactions: [
            { id: response.data.result.reaction_id },
          ] as any,
        },
        'removeFromExisting',
      );
    },
  });
};

export default useDeleteThreadReactionMutation;
