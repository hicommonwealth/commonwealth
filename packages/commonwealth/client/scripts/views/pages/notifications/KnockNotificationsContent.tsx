import {
  KnockFeedProvider,
  KnockProvider,
  NotificationFeed,
} from '@knocklabs/react';
import '@knocklabs/react/dist/index.css';
import React from 'react';
import useUserStore from 'state/ui/user';
import CustomNotificationCell from '../../components/KnockNotifications/CustomNotificationCell';

const KNOCK_PUBLIC_API_KEY = process.env.KNOCK_PUBLIC_API_KEY;
const KNOCK_IN_APP_FEED_ID = process.env.KNOCK_IN_APP_FEED_ID;

export const KnockNotificationsContent = () => {
  const user = useUserStore();

  return (
    <div className="KnockNotifications">
      <KnockProvider
        apiKey={KNOCK_PUBLIC_API_KEY!}
        userId={`${user.id}`}
        userToken={user.knockJWT}
      >
        <KnockFeedProvider feedId={KNOCK_IN_APP_FEED_ID!} colorMode="light">
          <NotificationFeed renderItem={CustomNotificationCell} />
        </KnockFeedProvider>
      </KnockProvider>
    </div>
  );
};
