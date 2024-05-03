import {
  KnockFeedProvider,
  KnockProvider,
  NotificationFeedPopover,
  NotificationIconButton,
} from '@knocklabs/react';
import React, { useEffect, useRef, useState } from 'react';

import '@knocklabs/react-notification-feed/dist/index.css';
import app, { initAppState } from 'state';

function useProfileId() {
  return '140756';
}

function useUserId(): number | undefined {
  const [userId, setUserId] = useState(undefined);

  useEffect(() => {
    async function doAsync() {
      if (app.user.id !== 0) {
        setUserId(app.user.id);
      } else {
        await initAppState();
        setUserId(app.user.id);
        console.log('FIXME setting user ID to: ' + app.user.id);
      }
    }

    doAsync().catch(console.error);
  }, []);

  return userId;
}

const KNOCK_PUBLIC_API_KEY =
  'pk_test_Hd4ZpzlVcz9bqepJQoo9BvZHokgEqvj4T79fPdKqpYM';
export const Knock = () => {
  const userId = useUserId();
  console.log('Using userId: ', userId);
  const [isVisible, setIsVisible] = useState(false);

  const notifButtonRef = useRef(null);

  // const knockClient = useAuthenticatedKnockClient(
  //   "pk_test_Hd4ZpzlVcz9bqepJQoo9BvZHokgEqvj4T79fPdKqpYM",
  //   `${id}`,
  // );

  return (
    <KnockProvider apiKey={KNOCK_PUBLIC_API_KEY} userId={`${userId}`}>
      {/* Optionally, use the KnockFeedProvider to connect an in-app feed */}
      <KnockFeedProvider feedId="fc6e68e5-b7b9-49c1-8fab-6dd7e3510ffb">
        <div>
          <NotificationIconButton
            ref={notifButtonRef}
            onClick={(e) => setIsVisible(!isVisible)}
          />
          <NotificationFeedPopover
            buttonRef={notifButtonRef}
            isVisible={isVisible}
            onClose={() => setIsVisible(false)}
          />
        </div>
      </KnockFeedProvider>
    </KnockProvider>
  );
};
