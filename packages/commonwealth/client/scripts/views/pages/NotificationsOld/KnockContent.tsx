import {
  KnockFeedProvider,
  KnockProvider,
  NotificationFeed,
} from '@knocklabs/react';
import React from 'react';
import app from 'state';

const KNOCK_PUBLIC_API_KEY =
  process.env.KNOCK_PUBLIC_API_KEY ||
  'pk_test_Hd4ZpzlVcz9bqepJQoo9BvZHokgEqvj4T79fPdKqpYM';

const KNOCK_IN_APP_FEED_ID =
  process.env.KNOCK_IN_APP_FEED_ID || 'fc6e68e5-b7b9-49c1-8fab-6dd7e3510ffb';

export const KnockContent = () => {
  const userId = app.user.id;
  const knockJWT = app.user.knockJWT;

  return (
    <KnockProvider
      apiKey={KNOCK_PUBLIC_API_KEY}
      userId={`${userId}`}
      userToken={knockJWT}
    >
      {/* Optionally, use the KnockFeedProvider to connect an in-app feed */}
      <KnockFeedProvider feedId={KNOCK_IN_APP_FEED_ID} colorMode="light">
        <div>
          <NotificationFeed />
        </div>
      </KnockFeedProvider>
    </KnockProvider>
  );
};
