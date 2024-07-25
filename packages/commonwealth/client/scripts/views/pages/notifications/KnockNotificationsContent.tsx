import {
  KnockFeedProvider,
  KnockProvider,
  NotificationFeed,
} from '@knocklabs/react';
import React from 'react';
import useUserStore from 'state/ui/user';

const KNOCK_PUBLIC_API_KEY = process.env.KNOCK_PUBLIC_API_KEY;
const KNOCK_IN_APP_FEED_ID = process.env.KNOCK_IN_APP_FEED_ID;

export const KnockNotificationsContent = () => {
  const user = useUserStore();

  return (
    <KnockProvider
      apiKey={KNOCK_PUBLIC_API_KEY!}
      userId={`${user.id}`}
      userToken={user.knockJWT}
    >
      <KnockFeedProvider feedId={KNOCK_IN_APP_FEED_ID!} colorMode="light">
        <NotificationFeed />
      </KnockFeedProvider>
    </KnockProvider>
  );
};
