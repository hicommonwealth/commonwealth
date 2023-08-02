import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';

interface CreateReactionProps {
  address: string;
  reactionType: 'like';
  threadId: number;
}

const createReaction = async ({
  address,
  reactionType,
  threadId
}: CreateReactionProps) => {
  const {
    session = null,
    action = null,
    hash = null,
  } = await app.sessions.signThreadReaction(address, {
    thread_id: threadId,
    like: reactionType === 'like',
  });

  return await axios.post(
    `${app.serverUrl()}/threads/${threadId}/reactions`,
    {
      author_chain: app.user.activeAccount.chain.id,
      thread_id: threadId,
      chain: app.chain.id,
      address,
      reaction: reactionType,
      jwt: app.user.jwt,
      canvas_action: action,
      canvas_session: session,
      canvas_hash: hash,
    }
  )
};

const useCreateThreadReactionMutation = () => {
  return useMutation({
    mutationFn: createReaction,
    onSuccess: async (response) => {
      // TODO: when we migrate the reactionCounts store proper to react query
      // then we will have to update the react query state here
    },
  });
};

export default useCreateThreadReactionMutation;
