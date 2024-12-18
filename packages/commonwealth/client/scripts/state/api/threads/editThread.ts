import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { signUpdateThread } from 'controllers/server/sessions';
import MinimumProfile from 'models/MinimumProfile';
import Thread from 'models/Thread';
import { ThreadStage } from 'models/types';
import { trpc } from 'utils/trpcClient';
import { useAuthModalStore } from '../../ui/modals';
import { userStore } from '../../ui/user';
import { updateThreadCountsByStageChange } from '../communities/getCommuityById';
import {
  updateThreadInAllCaches,
  updateThreadTopicInAllCaches,
} from './helpers/cache';

interface EditThreadProps {
  address: string;
  communityId: string;
  threadId: number;
  threadMsgId: string;
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

export const buildUpdateThreadInput = async ({
  address,
  communityId,
  threadId,
  threadMsgId,
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
}: EditThreadProps) => {
  let canvasSignedData;
  if (newBody || newTitle) {
    canvasSignedData = await signUpdateThread(address, {
      thread_id: threadMsgId,
      title: newTitle,
      body: newBody,
      link: url,
      topic: topicId,
    });
  }

  return {
    // common payload
    author_community_id: communityId,
    address: address,
    community_id: communityId,
    thread_id: threadId,
    jwt: userStore.getState().jwt,
    // for edit profile
    ...(url && { url }),
    ...(newBody && { body: newBody }),
    ...(newTitle && { title: newTitle }),
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
    ...(topicId !== undefined && { topic_id: topicId }),
    // for editing thread collaborators
    ...(collaborators !== undefined && { collaborators }),
    ...toCanvasSignedDataApiArgs(canvasSignedData),
  };
};

interface UseEditThreadMutationProps {
  communityId: string;
  threadId: number;
  threadMsgId: string;
  currentStage: ThreadStage;
  currentTopicId: number;
}

const useEditThreadMutation = ({
  communityId,
  threadId,
  currentStage,
  currentTopicId,
}: UseEditThreadMutationProps) => {
  const utils = trpc.useUtils();
  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  return trpc.thread.updateThread.useMutation({
    onSuccess: (updated) => {
      // @ts-expect-error StrictNullChecks
      const updatedThread = new Thread(updated);
      // Update community level thread counters variables
      if (currentStage !== updatedThread.stage) {
        updateThreadCountsByStageChange(
          communityId,
          currentStage,
          updatedThread.stage,
          utils,
        );
      }

      // add/remove thread from different caches if the topic id was changed
      if (updatedThread.topic?.id !== currentTopicId) {
        updateThreadTopicInAllCaches(
          communityId,
          threadId,
          updatedThread.topic!,
          currentTopicId,
        );
      }

      updateThreadInAllCaches(communityId, threadId, updatedThread);

      return updatedThread;
    },
    onError: (error) => checkForSessionKeyRevalidationErrors(error),
  });
};

export default useEditThreadMutation;
