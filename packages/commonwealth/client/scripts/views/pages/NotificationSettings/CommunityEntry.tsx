import { CommunityAlert } from '@hicommonwealth/schemas';
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

  const toggleSubscription = useCallback(async () => {
    async function doAsync() {
      if (subscribed) {
        await createCommunityAlert.mutateAsync({
          id: communityInfo.id,
          community_id: communityInfo.id,
        });
      } else {
        await deleteCommunityAlert.mutateAsync({
          id: communityInfo.id,
          community_ids: [communityInfo.id],
        });
      }

      setSubscribed(!subscribed);
    }

    doAsync().catch(console.error);
  }, [subscribed]);

  return (
    <div key={communityInfo?.id} className="notification-row">
      <div className="notification-row-header">
        <div className="left-content-container">
          <div className="avatar-and-name">
            <CWCommunityAvatar size="medium" community={communityInfo} />
            <CWText type="h5" fontWeight="medium">
              {communityInfo?.name}
            </CWText>

            <div style={{ marginLeft: 'auto' }} onClick={toggleSubscription}>
              <CWToggle checked={!!communityAlert} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
