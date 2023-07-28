import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { updateThreadInAllCaches } from "./helpers/cache";

interface IuseDeleteThreadReactionMutation {
  chainId: string;
  threadId: number;
}

interface DeleteReactionProps extends IuseDeleteThreadReactionMutation {
  reactionId: number;
}

const deleteReaction = async ({ reactionId, threadId }: DeleteReactionProps) => {
  const {
    session = null,
    action = null,
    hash = null,
  } = await app.sessions.signDeleteThreadReaction({
    thread_id: threadId,
  });

  const response = await axios.delete(`${app.serverUrl()}/reactions/${reactionId}`, {
    data: {
      jwt: app.user.jwt,
      canvas_action: action,
      canvas_session: session,
      canvas_hash: hash,
    },
  });

  return {
    ...response,
    data: {
      ...response.data,
      result: {
        thread_id: threadId,
        reaction_id: reactionId,
      }
    }
  }
};

const useDeleteThreadReactionMutation = ({ chainId, threadId }: IuseDeleteThreadReactionMutation) => {
  return useMutation({
    mutationFn: deleteReaction,
    onSuccess: async (response) => {
      updateThreadInAllCaches(chainId, threadId, { associatedReactions: [{ id: response.data.result.reaction_id }] as any }, 'removeFromExisting')
    }
  });
};

export default useDeleteThreadReactionMutation;
