import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import MinimumProfile from 'models/MinimumProfile';
import { ThreadStage } from 'models/types';
import app from 'state';

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
  authorProfile
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
  })

  return app.threads.modelFromServer(response.data.result)
};

interface UseEditThreadMutationProps {
  chainId: string
  threadId: number;
}

const useEditThreadMutation = ({ chainId, threadId }: UseEditThreadMutationProps) => {
  return useMutation({
    mutationFn: editThread,
    onSuccess: async (updatedThread) => {
      // TODO: migrate the thread store objects, then clean this up
      // Update counters
      // TODO: get this from react query state when fully migrated
      // if (proposal.stage === ThreadStage.Voting) app.threads.numVotingThreads--;
      if (updatedThread.stage === ThreadStage.Voting) app.threads.numVotingThreads++;
      // Post edits propagate to all thread stores
      app.threads._store.update(updatedThread);
      app.threads._listingStore.add(updatedThread);

      return updatedThread
    }
  });
};

export default useEditThreadMutation;
