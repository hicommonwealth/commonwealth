import {
  KnockFeedProvider,
  KnockProvider,
  NotificationFeedPopover,
  NotificationIconButton,
} from '@knocklabs/react';
import React, { useRef, useState } from 'react';
import app from 'state';

import '@knocklabs/react-notification-feed/dist/index.css';
import './KnockNotifications.scss';

const KNOCK_PUBLIC_API_KEY =
  'pk_test_Hd4ZpzlVcz9bqepJQoo9BvZHokgEqvj4T79fPdKqpYM';

const KNOCK_IN_APP_FEED_ID = 'fc6e68e5-b7b9-49c1-8fab-6dd7e3510ffb';

export const KnockNotifications = () => {
  const userId = app.user.id;
  const [isVisible, setIsVisible] = useState(false);

  const notifButtonRef = useRef(null);

  if (userId === 0) {
    return null;
  }
  return (
    <div className="KnockNotifications">
      <KnockProvider apiKey={KNOCK_PUBLIC_API_KEY} userId={`${userId}`}>
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
