import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';

interface DeleteReactionProps {
  threadId: number;
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

  return await axios.delete(`${app.serverUrl()}/reactions/${reactionId}`, {
    data: {
      jwt: app.user.jwt,
      canvas_action: action,
      canvas_session: session,
      canvas_hash: hash,
    },
  }).then((r) => ({
    ...r,
    data: {
      ...r.data,
      result: {
        thread_id: threadId,
        reaction_id: reactionId,
      }
    }
  }));
};

const useDeleteThreadReactionMutation = () => {
  return useMutation({
    mutationFn: deleteReaction,
    onSuccess: async (response) => {
      // TODO: this state below would be stored in threads react query state when we migrate the
      // whole thread controller from current state to react query
      const reaction = response.data.result

      app.threads.threadIdToReactions.set(
        reaction.thread_id,
        [...(app.threads.threadIdToReactions
          .get(reaction.thread_id)
          ?.filter((r) => r.id !== reaction.reaction_id + '') || [])]
      );
    }
  });
};

export default useDeleteThreadReactionMutation;
