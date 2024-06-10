import { CommunityAlert } from '@hicommonwealth/schemas';
import { notifySuccess } from 'controllers/app/notifications';
import type ChainInfo from 'models/ChainInfo';
import React, { useCallback, useState } from 'react';
import { trpc } from 'utils/trpcClient';
import { CWCommunityAvatar } from 'views/components/component_kit/cw_community_avatar';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWToggle } from 'views/components/component_kit/cw_toggle';
import { z } from 'zod';

type CommunityEntryProps = Readonly<{
  communityInfo: ChainInfo;
  communityAlert: z.infer<typeof CommunityAlert>;
}>;

export const CommunityEntry = (props: CommunityEntryProps) => {
  const { communityInfo, communityAlert } = props;

  const [subscribed, setSubscribed] = useState(!!communityAlert);

  const createCommunityAlert =
    trpc.subscription.createCommunityAlert.useMutation();

  const deleteCommunityAlert =
    trpc.subscription.deleteCommunityAlert.useMutation();

  const toggleSubscription = useCallback(() => {
    async function doAsync() {
      if (subscribed) {
        await deleteCommunityAlert.mutateAsync({
          id: communityInfo.id,
          community_ids: [communityInfo.id],
        });
        notifySuccess('Unsubscribed!');
      } else {
        await createCommunityAlert.mutateAsync({
          id: communityInfo.id,
          community_id: communityInfo.id,
        });
        notifySuccess('Subscribed!');
      }

      setSubscribed(!subscribed);
    }

    doAsync().catch(console.error);
  }, [
    communityInfo.id,
    createCommunityAlert,
    deleteCommunityAlert,
    subscribed,
  ]);

  return (
    <div key={communityInfo?.id} className="notification-row">
      <div className="notification-row-header">
        <div className="left-content-container">
          <div className="avatar-and-name">
            <CWCommunityAvatar size="medium" community={communityInfo} />
            <CWText type="h5" fontWeight="medium">
              {communityInfo?.name}
            </CWText>

            <div style={{ marginLeft: 'auto' }}>
              <CWToggle checked={subscribed} onChange={toggleSubscription} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
