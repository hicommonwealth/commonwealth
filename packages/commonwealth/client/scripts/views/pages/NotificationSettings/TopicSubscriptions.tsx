import { TopicSubscription } from '@hicommonwealth/schemas';
import React, { useCallback, useState } from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { LoadingIndicator } from 'views/components/LoadingIndicator/LoadingIndicator';
import { TopicEntry } from 'views/pages/NotificationSettings/TopicEntry';
import { useTopicSubscriptions } from 'views/pages/NotificationSettings/useTopicSubscriptions';
import { z } from 'zod';

export const TopicSubscriptions = () => {
  const { topicSubscriptions, subscribableTopics } = useTopicSubscriptions();
  const [topicsFilter, setTopicsFilter] = useState<readonly number[]>([]);

  const handleUnsubscribe = useCallback(
    (id: number) => {
      setTopicsFilter([...topicsFilter, id]);
    },
    [topicsFilter],
  );

  if (topicSubscriptions.isLoading || subscribableTopics.isLoading) {
    return <LoadingIndicator />;
  }

  const subscribedTopics = topicSubscriptions.data || [];
  const availableTopics = subscribableTopics.data || [];

  const allTopics = [
    ...subscribedTopics.map((topic) => ({
      ...topic,
      subscription: topic,
    })),
    ...availableTopics.map((topic) => ({
      ...topic,
      subscription: undefined,
    })),
  ].filter((topic) => !topicsFilter.includes(topic.id));

  if (!allTopics.length) {
    return (
      <CWText type="h4" className="error-content">
        No topics available for subscription.
      </CWText>
    );
  }

  return (
    <>
      <CWText type="h4" fontWeight="semiBold" className="section-header">
        Topic Subscriptions
      </CWText>

      <CWText className="page-subheader-text">
        Subscribe to topics to receive notifications about new discussions.
      </CWText>

      {allTopics.map((topic) => (
        <TopicEntry
          key={topic.id}
          id={topic.id}
          name={topic.name}
          community_id={topic.community_id}
          subscription={topic.subscription as z.infer<typeof TopicSubscription>}
        />
      ))}
    </>
  );
};
