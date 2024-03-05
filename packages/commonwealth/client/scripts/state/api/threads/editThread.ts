import ipldDagJson from '@ipld/dag-json';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import MinimumProfile from 'models/MinimumProfile';
import Thread from 'models/Thread';
import { ThreadStage } from 'models/types';
import app from 'state';
import {
  updateThreadInAllCaches,
  updateThreadTopicInAllCaches,
} from './helpers/cache';
import { updateThreadCountsByStageChange } from './helpers/counts';

interface EditThreadProps {
  address: string;
  chainId: string;
  threadId: number;
  // for edit profile
  newBody?: string;
  newTitle?: string;
  url?: string;
  authorProfile?: MinimumProfile;
  // for editing thread locked status
  readOnly?: boolean;
  // for editing thread stage
  stage?: string;
  // for editing thread pinned status
  pinned?: boolean;
  // for editing thread spam status
  spam?: boolean;
  // for editing thread archive status
  archived?: boolean;
  // for editing thread topic
  topicId?: number;
  // for editing thread collaborators
  collaborators?: {
    toAdd?: number[];
    toRemove?: number[];
  };
}

const editThread = async ({
  address,
  chainId,
  threadId,
  // for edit profile
  newBody,
  newTitle,
  url,
  authorProfile,
  // for editing thread locked status
  readOnly,
  // for editing thread stage
  stage,
  // for editing thread pinned status
  pinned,
  // for editing thread spam status
  spam,
  // for editing thread archived status
  archived,
  // for editing thread topic
  topicId,
  // for editing thread collaborators
  collaborators,
}: EditThreadProps): Promise<Thread> => {
  const {
    sessionMessage,
    sessionMessageSignature,
    actionMessage,
    actionMessageSignature,
  } = await app.sessions.signThread(address, {
    community: app.activeChainId(),
    title: newTitle,
    body: newBody,
    link: url,
    topic: topicId,
  });

  const response = await axios.patch(`${app.serverUrl()}/threads/${threadId}`, {
    // common payload
    author_community_id: chainId,
    address: address,
    community_id: chainId,
    jwt: app.user.jwt,
    // for edit profile
    ...(url && { url }),
    ...(newBody && { body: encodeURIComponent(newBody) }),
    ...(newTitle && { title: encodeURIComponent(newTitle) }),
    ...(authorProfile && { author: JSON.stringify(authorProfile) }),
    // for editing thread locked status
    ...(readOnly !== undefined && { locked: readOnly }),
    // for editing thread stage
    ...(stage && { stage }),
    // for editing thread pinned status
    ...(pinned !== undefined && { pinned }),
    // for editing thread spam status
    ...(spam !== undefined && { spam }),
    // for editing thread archived status
    ...(archived !== undefined && { archived }),
    // for editing thread topic
    ...(topicId !== undefined && { topicId }),
    // for editing thread collaborators
    ...(collaborators !== undefined && { collaborators }),
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
  });

  return new Thread(response.data.result);
};

interface UseEditThreadMutationProps {
  chainId: string;
  threadId: number;
  currentStage: ThreadStage;
  currentTopicId: number;
}

const useEditThreadMutation = ({
  chainId,
  threadId,
  currentStage,
  currentTopicId,
}: UseEditThreadMutationProps) => {
  return useMutation({
    mutationFn: editThread,
    onSuccess: async (updatedThread) => {
      // Update community level thread counters variables
      if (currentStage !== updatedThread.stage) {
        updateThreadCountsByStageChange(currentStage, updatedThread.stage);
      }

      // add/remove thread from different caches if the topic id was changed
      if (updatedThread.topic.id !== currentTopicId) {
        updateThreadTopicInAllCaches(
          chainId,
          threadId,
          updatedThread.topic,
          currentTopicId,
        );
      }

      updateThreadInAllCaches(chainId, threadId, updatedThread);

      return updatedThread;
    },
  });
};

export default useEditThreadMutation;
