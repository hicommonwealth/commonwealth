import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useFlag } from 'hooks/useFlag';
import MinimumProfile from 'models/MinimumProfile';
import Thread from 'models/Thread';
import Topic from 'models/Topic';
import { ThreadStage } from 'models/types';
import app from 'state';
import useUserOnboardingSliderMutationStore from 'state/ui/userTrainingCards';
import { UserTrainingCardTypes } from 'views/components/UserTrainingSlider/types';
import { EXCEPTION_CASE_threadCountersStore } from '../../ui/thread';
import { addThreadInAllCaches } from './helpers/cache';

interface CreateThreadProps {
  address: string;
  kind: 'discussion' | 'link';
  stage: string;
  communityId: string;
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
  communityId,
  title,
  topic,
  body,
  url,
  readOnly,
  authorProfile,
}: CreateThreadProps): Promise<Thread> => {
  const {
    action = null,
    session = null,
    hash = null,
  } = await app.sessions.signThread(address, {
    community: communityId,
    title,
    body,
    link: url,
    topic: topic.id,
  });

  const response = await axios.post(`${app.serverUrl()}/threads`, {
    author_community_id: communityId,
    community_id: communityId,
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
  });

  return new Thread(response.data.result);
};

const useCreateThreadMutation = ({
  communityId,
}: Partial<CreateThreadProps>) => {
  const userOnboardingEnabled = useFlag('userOnboardingEnabled');
  const {
    setCardTempMarkedAsCompleted,
    setShouldHideTrainingCardsPermanently,
  } = useUserOnboardingSliderMutationStore();

  return useMutation({
    mutationFn: createThread,
    onSuccess: async (newThread) => {
      addThreadInAllCaches(communityId, newThread);
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

      if (userOnboardingEnabled) {
        const profileId = app?.user?.addresses?.[0]?.profile?.id;
        setCardTempMarkedAsCompleted(UserTrainingCardTypes.CreateContent);
        setShouldHideTrainingCardsPermanently(
          profileId,
          UserTrainingCardTypes.CreateContent,
        );
      }

      return newThread;
    },
  });
};

export default useCreateThreadMutation;
