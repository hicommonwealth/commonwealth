import { CommunityAlert } from '@hicommonwealth/schemas';
import { notifySuccess } from 'controllers/app/notifications';
import type ChainInfo from 'models/ChainInfo';
import React, { useCallback, useState } from 'react';
import { useCreateCommunityAlertMutation } from 'state/api/trpc/subscription/useCreateCommunityAlertMutation';
import { useDeleteCommunityAlertMutation } from 'state/api/trpc/subscription/useDeleteCommunityAlertMutation';
import CommunityInfo from 'views/components/component_kit/CommunityInfo';
import { CWToggle } from 'views/components/component_kit/cw_toggle';
import { z } from 'zod';

type CommunityEntryProps = Readonly<{
  communityInfo: ChainInfo;
  communityAlert: z.infer<typeof CommunityAlert>;
}>;

export const CommunityEntry = (props: CommunityEntryProps) => {
  const { communityInfo, communityAlert } = props;

  const [subscribed, setSubscribed] = useState(!!communityAlert);

  const createCommunityAlert = useCreateCommunityAlertMutation();

  const deleteCommunityAlert = useDeleteCommunityAlertMutation();

  const toggleSubscription = useCallback(() => {
    async function doAsync() {
      if (subscribed) {
        await deleteCommunityAlert.mutateAsync({
          id: 0, // this should be the aggregate id (user?)
          community_ids: [communityInfo.id],
        });
        notifySuccess('Unsubscribed!');
      } else {
        await createCommunityAlert.mutateAsync({
          id: 0, // this should be the aggregate id (user?)
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

  // <div className="setting-container">
  //   <div className="setting-container-left">
  //     <CWText className="text-muted">
  //       Turn on notifications to receive alerts on your device.
  //     </CWText>
  //   </div>
  //
  //   <div className="setting-container-right">
  //     <PushNotificationsToggle />
  //   </div>
  // </div>

  return (
    <div key={communityInfo?.id} className="notification-row CommunityEntry">
      <div className="" style={{ display: 'flex', flexGrow: 1 }}>
        <div className="avatar-and-name">
          <CommunityInfo
            name={communityInfo.name}
            iconUrl={communityInfo.iconUrl}
            communityId={communityInfo.id}
          />
        </div>

        <div className="toggle" style={{ marginLeft: 'auto' }}>
          <CWToggle checked={subscribed} onChange={toggleSubscription} />
        </div>
      </div>
    </div>
  );
};
