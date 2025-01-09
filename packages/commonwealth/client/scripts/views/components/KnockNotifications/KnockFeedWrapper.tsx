import Knock from '@knocklabs/client';
import { KnockFeedProvider, KnockProvider } from '@knocklabs/react';
import React, { ReactNode, memo, useEffect } from 'react';
import useUserStore from 'state/ui/user';

const KNOCK_PUBLIC_API_KEY =
  process.env.KNOCK_PUBLIC_API_KEY ||
  'pk_test_Hd4ZpzlVcz9bqepJQoo9BvZHokgEqvj4T79fPdKqpYM';

const KNOCK_IN_APP_FEED_ID =
  process.env.KNOCK_IN_APP_FEED_ID || 'fc6e68e5-b7b9-49c1-8fab-6dd7e3510ffb';

const knock = new Knock(KNOCK_PUBLIC_API_KEY);

const getBrowserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

interface KnockFeedWrapperProps {
  children: ReactNode;
}

export const KnockFeedWrapper = memo(function KnockFeedWrapper({
  children,
}: KnockFeedWrapperProps) {
  const user = useUserStore();

  useEffect(() => {
    console.log('FIXME 1');
    if (!user.id || !user.isLoggedIn) return;
    if (!user.knockJWT) {
      console.warn('user knockJWT not set! Will not attempt to identify.');
      return;
    }

    const timezone = getBrowserTimezone();
    async function doAsync() {
      knock.authenticate(`${user.id}`, user.knockJWT);
      await knock.user.identify({
        id: user.id,
        email: user.email,
        timezone,
      });
    }

    doAsync().catch(console.error);
  }, [user.email, user.id, user.isLoggedIn, user.knockJWT]);

  return (
    <KnockProvider
      apiKey={KNOCK_PUBLIC_API_KEY}
      userId={`${user.id}`}
      userToken={user.knockJWT}
    >
      <KnockFeedProvider feedId={KNOCK_IN_APP_FEED_ID} colorMode="light">
        {children}
      </KnockFeedProvider>
    </KnockProvider>
  );
});
