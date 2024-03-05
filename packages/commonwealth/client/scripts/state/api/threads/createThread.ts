import ipldDagJson from '@ipld/dag-json';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import MinimumProfile from 'models/MinimumProfile';
import Thread from 'models/Thread';
import Topic from 'models/Topic';
import { ThreadStage } from 'models/types';
import app from 'state';
import { EXCEPTION_CASE_threadCountersStore } from '../../ui/thread';
import { addThreadInAllCaches } from './helpers/cache';

interface CreateThreadProps {
  address: string;
  kind: 'discussion' | 'link';
  stage: string;
  chainId: string;
  title: string;
  topic: Topic;
  body?: string;
  url?: string;
  readOnly?: boolean;
  authorProfile: MinimumProfile;
}

const createThread = async ({
  address,
  kind,
  stage,
  chainId,
  title,
  topic,
  body,
  url,
  readOnly,
  authorProfile,
}: CreateThreadProps): Promise<Thread> => {
  const {
    sessionMessage,
    sessionMessageSignature,
    actionMessage,
    actionMessageSignature,
  } = await app.sessions.signThread(address, {
    community: chainId,
    title,
    body,
    link: url,
    topic: topic.id,
  });

  const response = await axios.post(`${app.serverUrl()}/threads`, {
    author_chain: chainId,
    community_id: chainId,
    address,
    author: JSON.stringify(authorProfile),
    title: encodeURIComponent(title),
    body: encodeURIComponent(body),
    kind,
    stage,
    topic_name: topic.name,
    topic_id: topic.id,
    url,
    readOnly,
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
  });

  return new Thread(response.data.result);
};

const useCreateThreadMutation = ({ chainId }: Partial<CreateThreadProps>) => {
  return useMutation({
    mutationFn: createThread,
    onSuccess: async (newThread) => {
      addThreadInAllCaches(chainId, newThread);
      // Update community level thread counters variables
      EXCEPTION_CASE_threadCountersStore.setState(
        ({ totalThreadsInCommunity, totalThreadsInCommunityForVoting }) => ({
          totalThreadsInCommunity: totalThreadsInCommunity + 1,
          totalThreadsInCommunityForVoting:
            newThread.stage === ThreadStage.Voting
              ? totalThreadsInCommunityForVoting + 1
              : totalThreadsInCommunityForVoting,
        }),
      );
      return newThread;
    },
  });
};

export default useCreateThreadMutation;
