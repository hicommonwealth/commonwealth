import { TopicSubscription } from '@hicommonwealth/schemas';
import { notifySuccess } from 'controllers/app/notifications';
import React, { useCallback, useState } from 'react';
import { useCreateTopicSubscriptionMutation } from 'state/api/trpc/subscription/useCreateTopicSubscriptionMutation';
import { useDeleteTopicSubscriptionMutation } from 'state/api/trpc/subscription/useDeleteTopicSubscriptionMutation';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWToggle } from 'views/components/component_kit/cw_toggle';
import { z } from 'zod';

type TopicEntryProps = Readonly<{
  id: number;
  name: string;
  community_id: string;
  subscription?: z.infer<typeof TopicSubscription>;
}>;

export const TopicEntry = ({
  name,
  community_id,
  id,
  subscription,
}: TopicEntryProps) => {
  const [subscribed, setSubscribed] = useState(!!subscription);

  const createTopicSubscription = useCreateTopicSubscriptionMutation();
  const deleteTopicSubscription = useDeleteTopicSubscriptionMutation();

  const toggleSubscription = useCallback(() => {
    async function doAsync() {
      if (subscribed) {
        await deleteTopicSubscription.mutateAsync({
          topic_ids: [id],
        });
        notifySuccess('Unsubscribed!');
      } else {
        await createTopicSubscription.mutateAsync({
          topic_id: id.toString(),
        });
        notifySuccess('Subscribed!');
      }

      setSubscribed(!subscribed);
    }

    doAsync().catch(console.error);
  }, [id, createTopicSubscription, deleteTopicSubscription, subscribed]);

  return (
    <div key={id} className="notification-row TopicEntry">
      <div className="section">
        <div className="topic-info">
          <CWText type="h5" fontWeight="medium">
            {name}
          </CWText>
          <CWText type="caption" className="text-muted">
            Community: {community_id}
          </CWText>
        </div>

        <div className="toggle">
          <CWToggle checked={subscribed} onChange={toggleSubscription} />
        </div>
      </div>
    </div>
  );
};
