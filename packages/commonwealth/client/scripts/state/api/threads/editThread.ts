import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { signThread } from 'client/scripts/controllers/server/sessions';
import MinimumProfile from 'models/MinimumProfile';
import Thread from 'models/Thread';
import { ThreadStage } from 'models/types';
import { toCanvasSignedDataApiArgs } from 'shared/canvas/types';
import app from 'state';
import {
  updateThreadInAllCaches,
  updateThreadTopicInAllCaches,
} from './helpers/cache';
import { updateThreadCountsByStageChange } from './helpers/counts';

interface EditThreadProps {
  address: string;
  communityId: string;
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
  communityId,
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
  const canvasSignedData = await signThread(address, {
    community: app.activeChainId(),
    title: newTitle,
    body: newBody,
    link: url,
    topic: topicId,
  });

  const response = await axios.patch(`${app.serverUrl()}/threads/${threadId}`, {
    // common payload
    author_community_id: communityId,
    address: address,
    community_id: communityId,
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
    ...(await toCanvasSignedDataApiArgs(canvasSignedData)),
  });

  return new Thread(response.data.result);
};

interface UseEditThreadMutationProps {
  communityId: string;
  threadId: number;
  currentStage: ThreadStage;
  currentTopicId: number;
}

const useEditThreadMutation = ({
  communityId,
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
          communityId,
          threadId,
          updatedThread.topic,
          currentTopicId,
        );
      }

      updateThreadInAllCaches(communityId, threadId, updatedThread);

      return updatedThread;
    },
  });
};

export default useEditThreadMutation;
