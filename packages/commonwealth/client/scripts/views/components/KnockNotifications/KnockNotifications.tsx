import {
  KnockFeedProvider,
  KnockProvider,
  NotificationFeedPopover,
  NotificationIconButton,
} from '@knocklabs/react';
import '@knocklabs/react-notification-feed/dist/index.css';
import React, { useRef, useState } from 'react';
import useUserStore from 'state/ui/user';
import './KnockNotifications.scss';

const KNOCK_PUBLIC_API_KEY =
  process.env.KNOCK_PUBLIC_API_KEY ||
  'pk_test_Hd4ZpzlVcz9bqepJQoo9BvZHokgEqvj4T79fPdKqpYM';

const KNOCK_IN_APP_FEED_ID =
  process.env.KNOCK_IN_APP_FEED_ID || 'fc6e68e5-b7b9-49c1-8fab-6dd7e3510ffb';

export const KnockNotifications = () => {
  const user = useUserStore();
  const [isVisible, setIsVisible] = useState(false);

  const notifButtonRef = useRef(null);

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
