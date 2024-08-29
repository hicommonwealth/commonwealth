import { CommunityAlert } from '@hicommonwealth/schemas';
import { notifySuccess } from 'controllers/app/notifications';
import React, { useCallback, useState } from 'react';
import { useCreateCommunityAlertMutation } from 'state/api/trpc/subscription/useCreateCommunityAlertMutation';
import { useDeleteCommunityAlertMutation } from 'state/api/trpc/subscription/useDeleteCommunityAlertMutation';
import CommunityInfo from 'views/components/component_kit/CommunityInfo';
import { CWToggle } from 'views/components/component_kit/cw_toggle';
import { z } from 'zod';

type CommunityEntryProps = Readonly<{
  id: string;
  name: string;
  iconUrl: string;
  alert: z.infer<typeof CommunityAlert>;
}>;

export const CommunityEntry = ({
  name,
  iconUrl,
  id,
  alert,
}: CommunityEntryProps) => {
  const [subscribed, setSubscribed] = useState(!!alert);

  const createCommunityAlert = useCreateCommunityAlertMutation();

  const deleteCommunityAlert = useDeleteCommunityAlertMutation();

  const toggleSubscription = useCallback(() => {
    async function doAsync() {
      if (subscribed) {
        await deleteCommunityAlert.mutateAsync({
          id: 0, // this should be the aggregate id (user?)
          community_ids: [id],
        });
        notifySuccess('Unsubscribed!');
      } else {
        await createCommunityAlert.mutateAsync({
          id: 0, // this should be the aggregate id (user?)
          community_id: id,
        });
        notifySuccess('Subscribed!');
      }

      setSubscribed(!subscribed);
    }

    doAsync().catch(console.error);
  }, [id, createCommunityAlert, deleteCommunityAlert, subscribed]);

  return (
    <div key={id} className="notification-row CommunityEntry">
      <div className="section">
        <div className="avatar-and-name">
          <CommunityInfo name={name} iconUrl={iconUrl} communityId={id} />
        </div>

        <div className="toggle">
          <CWToggle checked={subscribed} onChange={toggleSubscription} />
        </div>
      </div>
    </div>
  );
};
