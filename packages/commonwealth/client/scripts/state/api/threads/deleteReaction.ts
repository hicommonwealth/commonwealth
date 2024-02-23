import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { updateThreadInAllCaches } from './helpers/cache';

interface UseDeleteThreadReactionMutationProps {
  chainId: string;
  address: string;
  threadId: number;
  threadReactionWeightsSum?: number;
  voteWeight?: number;
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
  const {
    session = null,
    action = null,
    hash = null,
  } = await app.sessions.signDeleteThreadReaction(address, {
    thread_id: threadId,
  });

  const response = await axios.delete(
    `${app.serverUrl()}/reactions/${reactionId}`,
    {
      data: {
        author_community_id: chainId,
        address: address,
        community_id: app.chain.id,
        jwt: app.user.jwt,
        canvas_action: action,
        canvas_session: session,
        canvas_hash: hash,
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
  threadReactionWeightsSum,
  voteWeight,
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
      updateThreadInAllCaches(chainId, threadId, {
        ...(voteWeight && {
          reactionWeightsSum: threadReactionWeightsSum - voteWeight,
        }),
      });
    },
  });
};

export default useDeleteThreadReactionMutation;
