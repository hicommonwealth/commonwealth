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
  } = await app.sessions.signThreadReaction({
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
      const reaction = response.data.result
      const formattedReaction = {
        id: reaction.id + '',
        type: reaction.reaction,
        address: reaction.Address.address
      }

      // TODO: this state below would be stored in threads react query state when we migrate the
      // whole thread controller from current state to react query
      const existingReactions = app.threads.threadIdToReactions.get(reaction.thread_id)
      if (!existingReactions) {
        app.threads.threadIdToReactions.set(reaction.thread_id, [formattedReaction]);
      } else {
        app.threads.threadIdToReactions.set(reaction.thread_id, [
          ...existingReactions,
          formattedReaction
        ]);
      }
    },
  });
};

export default useCreateThreadReactionMutation;
