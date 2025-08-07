import {
  GetSubscribableTopics,
  GetTopicSubscriptions,
} from '@hicommonwealth/schemas';
import { useMemo } from 'react';
import { useSubscribableTopicsQuery } from 'state/api/trpc/subscription/useSubscribableTopicsQuery';
import { useTopicSubscriptionsQuery } from 'state/api/trpc/subscription/useTopicSubscriptionsQuery';

export function useTopicSubscriptions() {
  const topicSubscriptions = useTopicSubscriptionsQuery();
  const subscribableTopics = useSubscribableTopicsQuery();

  return useMemo(() => {
    return {
      topicSubscriptions: {
        ...topicSubscriptions,
        data: topicSubscriptions.data
          ? GetTopicSubscriptions.output.parse(topicSubscriptions.data)
          : topicSubscriptions.data,
      },
      subscribableTopics: {
        ...subscribableTopics,
        data: subscribableTopics.data
          ? GetSubscribableTopics.output.parse(subscribableTopics.data)
          : subscribableTopics.data,
      },
    };
  }, [topicSubscriptions, subscribableTopics]);
}
