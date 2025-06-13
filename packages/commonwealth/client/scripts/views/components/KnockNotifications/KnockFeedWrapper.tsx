import Knock from '@knocklabs/client';
import { KnockFeedProvider, KnockProvider } from '@knocklabs/react';
import React, { ReactNode, memo, useEffect } from 'react';
import useFetchPublicEnvVarQuery from 'state/api/configuration/fetchPublicEnvVar';
import useUserStore from 'state/ui/user';

let knock: Knock | undefined;
function getKnockClient(KNOCK_PUBLIC_API_KEY?: string) {
  if (knock) return knock;

  if (!KNOCK_PUBLIC_API_KEY) {
    throw new Error('KNOCK_PUBLIC_API_KEY is not set');
  }
  knock = new Knock(KNOCK_PUBLIC_API_KEY);
  return knock;
}

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
  const { data: publicEnvVars } = useFetchPublicEnvVarQuery();

  useEffect(() => {
    const initializeKnock = async () => {
      const knockClient = getKnockClient(publicEnvVars!.KNOCK_PUBLIC_API_KEY);
      if (!user.id || !user.isLoggedIn || !user.knockJWT) {
        knockClient.teardown();
        return;
      }

      const timezone = getBrowserTimezone();

      try {
        // eslint-disable-next-line @typescript-eslint/await-thenable
        knockClient.authenticate(`${user.id}`, user.knockJWT);
        await knockClient.user.identify({
          id: user.id,
          email: user.email,
          timezone,
        });
      } catch (error) {
        console.error('Error initializing Knock:', error);
        knockClient.teardown();
      }
    };

    initializeKnock().catch((error) => {
      console.error('Error during Knock initialization:', error);
    });

    return () => getKnockClient(publicEnvVars!.KNOCK_PUBLIC_API_KEY).teardown();
  }, [
    user.id,
    user.email,
    user.isLoggedIn,
    user.knockJWT,
    publicEnvVars!.KNOCK_PUBLIC_API_KEY,
  ]);

  if (!user.id || !user.isLoggedIn || !user.knockJWT) {
    // Render children directly if user is not logged in or authenticated
    return <>{children}</>;
  }

  return (
    <KnockProvider
      apiKey={publicEnvVars!.KNOCK_PUBLIC_API_KEY!}
      userId={`${user.id}`}
      userToken={user.knockJWT}
    >
      <KnockFeedProvider
        feedId={publicEnvVars!.KNOCK_IN_APP_FEED_ID!}
        colorMode="light"
        defaultFeedOptions={{
          auto_manage_socket_connection: false,
        }}
      >
        {children}
      </KnockFeedProvider>
    </KnockProvider>
  );
});
