import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { NotificationCategories } from 'common-common/src/types';
import { updateLastVisited } from 'controllers/app/login';
import MinimumProfile from 'models/MinimumProfile';
import NotificationSubscription from 'models/NotificationSubscription';
import Topic from 'models/Topic';
import {
  ThreadStage
} from 'models/types';
import app from 'state';

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
  authorProfile
}: CreateThreadProps) => {
  const {
    action = null,
    session = null,
    hash = null,
  } = await app.sessions.signThread({
    community: chainId,
    title,
    body,
    link: url,
    topic: topic.id,
  });

  const response = await axios.post(
    `${app.serverUrl()}/threads`,
    {
      author_chain: chainId,
      chain: chainId,
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
      canvas_action: action,
      canvas_session: session,
      canvas_hash: hash,
    }
  );

  return app.threads.modelFromServer(response.data.result)
};

const useCreateThreadMutation = ({ chainId }: Partial<CreateThreadProps>) => {
  return useMutation({
    mutationFn: createThread,
    onSuccess: async (newThread) => {
      // TODO: migrate the thread store objects, then clean this up
      // Update stage counts
      if (newThread.stage === ThreadStage.Voting) app.threads.numVotingThreads++;

      // New posts are added to both the topic and allProposals sub-store
      const lastPinnedThreadIndex = app.threads.store
        .getAll()
        .slice()
        .reverse()
        .findIndex((x) => x.pinned === true);
      app.threads.store.add(newThread, {
        pushToIndex: lastPinnedThreadIndex || 0,
      });
      app.threads.numTotalThreads += 1;
      app.threads._listingStore.add(newThread);
      const activeEntity = app.chain;
      updateLastVisited(activeEntity.meta, true);

      // synthesize new subscription rather than hitting backend
      const subscriptionJSON = {
        id: null,
        category_id: NotificationCategories.NewComment,
        object_id: `discussion_${newThread.id}`,
        is_active: true,
        created_at: Date.now(),
        immediate_email: false,
        chain_id: newThread.chain,
        offchain_thread_id: newThread.id,
      };
      app.user.notifications.subscriptions.push(
        NotificationSubscription.fromJSON(subscriptionJSON)
      );

      return newThread
    },
  });
};

export default useCreateThreadMutation;
