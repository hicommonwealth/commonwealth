import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { updateThreadInAllCaches } from './helpers/cache';

interface IuseCreateThreadReactionMutation {
  threadId: number;
  chainId: string;
  threadReactionWeightsSum?: number;
  voteWeight?: number;
}
interface CreateReactionProps extends IuseCreateThreadReactionMutation {
  address: string;
  reactionType?: 'like';
}

const createReaction = async ({
  address,
  reactionType = 'like',
  threadId,
}: CreateReactionProps) => {
  const {
    session = null,
    action = null,
    hash = null,
  } = await app.sessions.signThreadReaction(address, {
    thread_id: threadId,
    like: reactionType === 'like',
  });

  return await axios.post(`${app.serverUrl()}/threads/${threadId}/reactions`, {
    author_community_id: app.user.activeAccount.community.id,
    thread_id: threadId,
    community_id: app.chain.id,
    address,
    reaction: reactionType,
    jwt: app.user.jwt,
    canvas_action: action,
    canvas_session: session,
    canvas_hash: hash,
  });
};

const useCreateThreadReactionMutation = ({
  chainId,
  threadId,
  threadReactionWeightsSum,
  voteWeight,
}: IuseCreateThreadReactionMutation) => {
  return useMutation({
    mutationFn: createReaction,
    onSuccess: async (response) => {
      const reaction: any = {
        id: response.data.result.id,
        address: response.data.result.Address.address,
        type: 'like',
        updated_at: response.data.result.updated_at,
        voting_weight: response.data.result.calculated_voting_weight,
      };
      updateThreadInAllCaches(
        chainId,
        threadId,
        { associatedReactions: [reaction] },
        'combineAndRemoveDups',
      );
      updateThreadInAllCaches(chainId, threadId, {
        ...(voteWeight && {
          reactionWeightsSum: threadReactionWeightsSum + voteWeight,
        }),
      });
    },
  });
};

export default useCreateThreadReactionMutation;
