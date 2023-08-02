import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import MinimumProfile from 'models/MinimumProfile';
import Thread from 'models/Thread';
import { ThreadStage } from 'models/types';
import app from 'state';
import { EXCEPTION_CASE_threadCountersStore } from '../../ui/thread';
import { updateThreadInAllCaches } from './helpers/cache';

interface EditThreadProps {
  address: string;
  chainId: string;
  threadId: number;
  topicId: number;
  kind: 'discussion' | 'link';
  stage: string;
  newBody: string;
  newTitle: string;
  url?: string;
  authorProfile: MinimumProfile;
}

const editThread = async ({
  address,
  chainId,
  threadId,
  topicId,
  kind,
  stage,
  newBody,
  newTitle,
  url,
  authorProfile,
}: EditThreadProps) => {
  const {
    action = null,
    session = null,
    hash = null,
  } = await app.sessions.signThread({
    community: app.activeChainId(),
    title: newTitle,
    body: newBody,
    link: url,
    topic: topicId,
  });

  const response = await axios.patch(`${app.serverUrl()}/threads/${threadId}`, {
    author_chain: chainId,
    author: JSON.stringify(authorProfile),
    address: address,
    chain: chainId,
    kind: kind,
    stage: stage,
    body: encodeURIComponent(newBody),
    title: encodeURIComponent(newTitle),
    url,
    jwt: app.user.jwt,
    canvas_action: action,
    canvas_session: session,
    canvas_hash: hash,
  });

  return new Thread(response.data.result);
};

interface UseEditThreadMutationProps {
  chainId: string;
  threadId: number;
  currentStage: ThreadStage;
}

const useEditThreadMutation = ({
  chainId,
  threadId,
  currentStage,
}: UseEditThreadMutationProps) => {
  return useMutation({
    mutationFn: editThread,
    onSuccess: async (updatedThread) => {
      // Update community level thread counters variables
      let incBy = 0;
      if (currentStage === ThreadStage.Voting) incBy--;
      if (updatedThread.stage === ThreadStage.Voting) incBy++;
      EXCEPTION_CASE_threadCountersStore.setState(
        ({ totalThreadsInCommunityForVoting }) => ({
          totalThreadsInCommunityForVoting:
            totalThreadsInCommunityForVoting + incBy,
        })
      );
      updateThreadInAllCaches(chainId, threadId, updatedThread);

      return updatedThread;
    },
  });
};

export default useEditThreadMutation;
