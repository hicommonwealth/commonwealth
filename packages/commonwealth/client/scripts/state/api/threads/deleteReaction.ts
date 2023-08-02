import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';

interface DeleteReactionProps {
  threadId: number;
  reactionId: number;
}

const deleteReaction = async ({
  reactionId,
  threadId,
}: DeleteReactionProps) => {
  const {
    session = null,
    action = null,
    hash = null,
  } = await app.sessions.signDeleteThreadReaction(
    app.user.activeAccount.address,
    {
      thread_id: threadId,
    }
  );

  const response = await axios.delete(
    `${app.serverUrl()}/reactions/${reactionId}`,
    {
      data: {
        jwt: app.user.jwt,
        canvas_action: action,
        canvas_session: session,
        canvas_hash: hash,
      },
    }
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

const useDeleteThreadReactionMutation = () => {
  return useMutation({
    mutationFn: deleteReaction,
    onSuccess: async (response) => {
      // TODO: when we migrate the reactionCounts store proper to react query
      // then we will have to update the react query state here
    },
  });
};

export default useDeleteThreadReactionMutation;
