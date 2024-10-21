import Knock from '@knocklabs/client';
import {
  KnockFeedProvider,
  KnockProvider,
  NotificationFeedPopover,
  NotificationIconButton,
} from '@knocklabs/react';
import '@knocklabs/react-notification-feed/dist/index.css';
import React, { useEffect, useRef, useState } from 'react';
import useUserStore from 'state/ui/user';
import './KnockNotifications.scss';

const KNOCK_PUBLIC_API_KEY =
  process.env.KNOCK_PUBLIC_API_KEY ||
  'pk_test_Hd4ZpzlVcz9bqepJQoo9BvZHokgEqvj4T79fPdKqpYM';

const KNOCK_IN_APP_FEED_ID =
  process.env.KNOCK_IN_APP_FEED_ID || 'fc6e68e5-b7b9-49c1-8fab-6dd7e3510ffb';

const knock = new Knock(KNOCK_PUBLIC_API_KEY);

const getBrowserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export const KnockNotifications = () => {
  const user = useUserStore();
  const [isVisible, setIsVisible] = useState(false);

  const notifButtonRef = useRef(null);

  useEffect(() => {
    if (!user.id) {
      return;
    }

    if (!user.knockJWT) {
      console.warn('user knockJWT not set!  Will not attempt to identify.');
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
  }, [user.email, user.id, user.knockJWT]);

  if (user.id === 0) {
    return null;
  }

  if (!user.knockJWT) {
    return null;
  }

  return (
    <div className="KnockNotifications">
      <KnockProvider
        apiKey={KNOCK_PUBLIC_API_KEY}
        userId={`${user.id}`}
        userToken={user.knockJWT}
      >
        {/* Optionally, use the KnockFeedProvider to connect an in-app feed */}
        <KnockFeedProvider feedId={KNOCK_IN_APP_FEED_ID} colorMode="light">
          <div>
            <NotificationIconButton
              ref={notifButtonRef}
              onClick={() => setIsVisible(!isVisible)}
            />
            <NotificationFeedPopover
              buttonRef={notifButtonRef}
              isVisible={isVisible}
              onClose={() => setIsVisible(false)}
            />
          </div>
        </KnockFeedProvider>
      </KnockProvider>
    </div>
  );
};
