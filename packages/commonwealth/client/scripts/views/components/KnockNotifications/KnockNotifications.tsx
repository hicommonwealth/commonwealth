import {
  KnockFeedProvider,
  KnockProvider,
  NotificationFeedPopover,
  NotificationIconButton,
} from '@knocklabs/react';
import '@knocklabs/react-notification-feed/dist/index.css';
import React, { memo, useRef, useState } from 'react';
import useUserStore from 'state/ui/user';
import CustomNotificationCell from './CustomNotificationCell';
import './KnockNotifications.scss';
const KNOCK_PUBLIC_API_KEY =
  process.env.KNOCK_PUBLIC_API_KEY ||
  'pk_test_Hd4ZpzlVcz9bqepJQoo9BvZHokgEqvj4T79fPdKqpYM';

const KNOCK_IN_APP_FEED_ID =
  process.env.KNOCK_IN_APP_FEED_ID || 'fc6e68e5-b7b9-49c1-8fab-6dd7e3510ffb';

export const KnockNotifications = memo(function KnockNotifications() {
  const user = useUserStore();
  const [isVisible, setIsVisible] = useState(false);

  const notifButtonRef = useRef(null);

  return (
    <div className="KnockNotifications">
      <KnockProvider
        apiKey={KNOCK_PUBLIC_API_KEY}
        userId={`${user.id}`}
        userToken={user.knockJWT}
      >
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
              renderItem={CustomNotificationCell}
            />
          </div>
        </KnockFeedProvider>
      </KnockProvider>
    </div>
  );
});
