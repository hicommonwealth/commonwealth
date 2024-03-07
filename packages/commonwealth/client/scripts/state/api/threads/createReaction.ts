import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toCanvasSignedDataApiArgs } from 'shared/canvas/types';
import app from 'state';
import { updateThreadInAllCaches } from './helpers/cache';

interface IuseCreateThreadReactionMutation {
  threadId: number;
  chainId: string;
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
  const serializedCanvasSignedData = await app.sessions.signThreadReaction(
    address,
    {
      thread_id: threadId,
      like: reactionType === 'like',
    },
  );

  return await axios.post(`${app.serverUrl()}/threads/${threadId}/reactions`, {
    author_community_id: app.user.activeAccount.community.id,
    thread_id: threadId,
    community_id: app.chain.id,
    address,
    reaction: reactionType,
    jwt: app.user.jwt,
    ...toCanvasSignedDataApiArgs(serializedCanvasSignedData),
  });
};

const useCreateThreadReactionMutation = ({
  chainId,
  threadId,
}: IuseCreateThreadReactionMutation) => {
  return useMutation({
    mutationFn: createReaction,
    onSuccess: async (response) => {
      const reaction: any = {
        id: response.data.result.id,
        address: response.data.result.Address.address,
        type: 'like',
        updated_at: response.data.result.updated_at,
        voting_weight: response.data.result.calculated_voting_weight || 1,
      };
      updateThreadInAllCaches(
        chainId,
        threadId,
        { associatedReactions: [reaction] },
        'combineAndRemoveDups',
      );
    },
  });
};

export default useCreateThreadReactionMutation;
