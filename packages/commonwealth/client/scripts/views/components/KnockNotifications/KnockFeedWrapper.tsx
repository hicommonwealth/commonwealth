import Knock from '@knocklabs/client';
import { KnockFeedProvider, KnockProvider } from '@knocklabs/react';
import React, { ReactNode, useEffect } from 'react';
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

export const KnockFeedWrapper = ({ children }: KnockFeedWrapperProps) => {
  const user = useUserStore();

  useEffect(() => {
    const initializeKnock = async () => {
      if (!user.id || !user.isLoggedIn || !user.knockJWT) {
        knock.teardown();
        return;
      }

      const timezone = getBrowserTimezone();

      try {
        // eslint-disable-next-line @typescript-eslint/await-thenable
        knock.authenticate(`${user.id}`, user.knockJWT);
        await knock.user.identify({
          id: user.id,
          email: user.email,
          timezone,
        });
      } catch (error) {
        console.error('Error initializing Knock:', error);
        knock.teardown();
      }
    };

    initializeKnock().catch((error) => {
      console.error('Error during Knock initialization:', error);
    });

    return () => knock.teardown();
  }, [user.id, user.email, user.isLoggedIn, user.knockJWT]);

  if (!user.id || !user.isLoggedIn || !user.knockJWT) return null;

  return (
    <KnockProvider
      apiKey={KNOCK_PUBLIC_API_KEY}
      userId={`${user.id}`}
      userToken={user.knockJWT}
    >
      <KnockFeedProvider
        feedId={KNOCK_IN_APP_FEED_ID}
        colorMode="light"
        defaultFeedOptions={{
          auto_manage_socket_connection: false,
        }}
      >
        {children}
      </KnockFeedProvider>
    </KnockProvider>
  );
};
