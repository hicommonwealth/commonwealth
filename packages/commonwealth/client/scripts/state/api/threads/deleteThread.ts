import ipldDagJson from '@ipld/dag-json';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { ThreadStage } from 'models/types';
import app from 'state';
import { EXCEPTION_CASE_threadCountersStore } from '../../ui/thread';
import { removeThreadFromAllCaches } from './helpers/cache';

interface DeleteThreadProps {
  chainId: string;
  threadId: number;
  address: string;
}

const deleteThread = async ({
  chainId,
  threadId,
  address,
}: DeleteThreadProps) => {
  const {
    sessionMessage,
    sessionMessageSignature,
    actionMessage,
    actionMessageSignature,
  } = await app.sessions.signDeleteThread(address, {
    thread_id: threadId,
  });

  return await axios.delete(`${app.serverUrl()}/threads/${threadId}`, {
    data: {
      author_community_id: chainId,
      community_id: chainId,
      address: address,
      jwt: app.user.jwt,
      canvas_action_message: actionMessage
        ? ipldDagJson.stringify(ipldDagJson.encode(actionMessage))
        : null,
      canvas_action_message_signature: actionMessageSignature
        ? ipldDagJson.stringify(ipldDagJson.encode(actionMessageSignature))
        : null,
      canvas_session_message: sessionMessage
        ? ipldDagJson.stringify(ipldDagJson.encode(sessionMessage))
        : null,
      canvas_session_message_signature: sessionMessageSignature
        ? ipldDagJson.stringify(ipldDagJson.encode(sessionMessageSignature))
        : null,
    },
  });
};

interface UseDeleteThreadMutationProps {
  chainId: string;
  threadId: number;
  currentStage: ThreadStage;
}

const useDeleteThreadMutation = ({
  chainId,
  threadId,
  currentStage,
}: UseDeleteThreadMutationProps) => {
  return useMutation({
    mutationFn: deleteThread,
    onSuccess: async (response) => {
      // Update community level thread counters variables
      EXCEPTION_CASE_threadCountersStore.setState(
        ({ totalThreadsInCommunity, totalThreadsInCommunityForVoting }) => ({
          totalThreadsInCommunity: totalThreadsInCommunity - 1,
          totalThreadsInCommunityForVoting:
            currentStage === ThreadStage.Voting
              ? totalThreadsInCommunityForVoting - 1
              : totalThreadsInCommunityForVoting,
        }),
      );
      removeThreadFromAllCaches(chainId, threadId);
      return response.data;
    },
  });
};

export default useDeleteThreadMutation;
