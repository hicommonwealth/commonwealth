import {
  KnockFeedProvider,
  KnockProvider,
  NotificationFeed,
} from '@knocklabs/react';
import '@knocklabs/react/dist/index.css';
import React from 'react';
import { useFetchPublicEnvVarQuery } from 'state/api/configuration';
import useUserStore from 'state/ui/user';
import CustomNotificationCell from '../../components/KnockNotifications/CustomNotificationCell';

export const KnockNotificationsContent = () => {
  const { data: configurationData } = useFetchPublicEnvVarQuery();
  const user = useUserStore();

  return (
    <div className="KnockNotifications">
      <KnockProvider
        apiKey={configurationData!.KNOCK_PUBLIC_API_KEY}
        userId={`${user.id}`}
        userToken={user.knockJWT}
      >
        <KnockFeedProvider
          feedId={configurationData!.KNOCK_IN_APP_FEED_ID}
          colorMode="light"
        >
          <NotificationFeed renderItem={CustomNotificationCell} />
        </KnockFeedProvider>
      </KnockProvider>
    </div>
  );
};
