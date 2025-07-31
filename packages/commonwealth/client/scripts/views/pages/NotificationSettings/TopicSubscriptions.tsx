import { TopicSubscription } from '@hicommonwealth/schemas';
import React, { useMemo } from 'react';
import useUserStore from 'state/ui/user';
import CommunityInfo from 'views/components/component_kit/CommunityInfo';
import { CWCollapsible } from 'views/components/component_kit/cw_collapsible';
import { CWText } from 'views/components/component_kit/cw_text';
import { LoadingIndicator } from 'views/components/LoadingIndicator/LoadingIndicator';
import { TopicEntry } from 'views/pages/NotificationSettings/TopicEntry';
import { useTopicSubscriptions } from 'views/pages/NotificationSettings/useTopicSubscriptions';
import { z } from 'zod';

type TopicEntryData = {
  id: number;
  name: string;
  community_id: string;
  subscription?: z.infer<typeof TopicSubscription>;
};

type GroupedTopics = {
  [community_id: string]: TopicEntryData[];
};

export const TopicSubscriptions = () => {
  const { topicSubscriptions, subscribableTopics } = useTopicSubscriptions();
  const user = useUserStore();

  const allTopics: TopicEntryData[] = useMemo(() => {
    const subscribedTopics = topicSubscriptions.data || [];
    const availableTopics = subscribableTopics.data || [];

    // Create a map of subscribed topic IDs to avoid duplicates
    const subscribedTopicIds = new Set(
      subscribedTopics.map((sub) => sub.topic_id),
    );

    const allTopicsData = [
      ...subscribedTopics.map((subscription) => ({
        id: subscription.topic_id,
        name: subscription.Topic.name,
        community_id: subscription.Topic.community_id,
        subscription,
      })),
      ...availableTopics
        .filter((topic) => !subscribedTopicIds.has(topic.id))
        .map((topic) => ({
          ...topic,
        })),
    ];

    // Sort by community_id first, then by name to maintain consistent order
    return allTopicsData.sort((a, b) => {
      if (a.community_id !== b.community_id) {
        return a.community_id.localeCompare(b.community_id);
      }
      return a.name.localeCompare(b.name);
    });
  }, [topicSubscriptions.data, subscribableTopics.data]);

  // Group topics by community_id
  const groupedTopics: GroupedTopics = useMemo(() => {
    const grouped: GroupedTopics = {};
    allTopics.forEach((topic) => {
      if (!grouped[topic.community_id]) {
        grouped[topic.community_id] = [];
      }
      grouped[topic.community_id].push(topic);
    });
    return grouped;
  }, [allTopics]);

  // Create a map of community_id to community info
  const communityInfoMap = useMemo(() => {
    const map: { [community_id: string]: { name: string; iconUrl?: string } } =
      {};
    user.communities.forEach((community) => {
      if (community.id) {
        map[community.id] = {
          name: community.name || community.id,
          iconUrl: community.iconUrl,
        };
      }
    });
    return map;
  }, [user.communities]);

  if (topicSubscriptions.isLoading || subscribableTopics.isLoading) {
    return <LoadingIndicator />;
  }

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

      {Object.entries(groupedTopics).map(([community_id, topics]) => {
        const communityInfo = communityInfoMap[community_id];
        return (
          <CWCollapsible
            key={community_id}
            iconSize="small"
            headerContent={
              <div className="community-header">
                <div className="community-info">
                  <CommunityInfo
                    name={communityInfo?.name || community_id}
                    iconUrl={communityInfo?.iconUrl || ''}
                    communityId={community_id}
                  />
                </div>
                <CWText type="caption" className="text-muted">
                  {topics.length} topic{topics.length !== 1 ? 's' : ''}
                </CWText>
              </div>
            }
            collapsibleContent={
              <div className="topics-container">
                {topics.map((topic: TopicEntryData) => (
                  <TopicEntry
                    key={topic.id}
                    id={topic.id}
                    name={topic.name}
                    community_id={topic.community_id}
                    subscription={topic.subscription}
                  />
                ))}
              </div>
            }
          />
        );
      })}
    </>
  );
};
