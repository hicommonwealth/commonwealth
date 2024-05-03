import {
  KnockFeedProvider,
  KnockProvider,
  NotificationFeedPopover,
  NotificationIconButton,
} from '@knocklabs/react';
import React, { useRef, useState } from 'react';

import '@knocklabs/react-notification-feed/dist/index.css';
import app from 'state';

const KNOCK_PUBLIC_API_KEY =
  'pk_test_Hd4ZpzlVcz9bqepJQoo9BvZHokgEqvj4T79fPdKqpYM';

const KNOCK_IN_APP_FEED_ID = 'fc6e68e5-b7b9-49c1-8fab-6dd7e3510ffb';

function useUserId(): number | undefined {
  // const [userId, setUserId] = useState(undefined);
  //
  // setUserId(app.user.id);

  // useEffect(() => {
  //   async function doAsync() {
  //     if (app.user.id !== 0) {
  //       setUserId(app.user.id);
  //     } else {
  //       await initAppState();
  //       setUserId(app.user.id);
  //     }
  //   }
  //
  //   doAsync().catch(console.error);
  // }, []);

  return app.user.id;
}

export const Knock = () => {
  const userId = useUserId();
  const [isVisible, setIsVisible] = useState(false);

  const notifButtonRef = useRef(null);

  if (userId === 0) {
    return null;
  }

  return (
    <KnockProvider apiKey={KNOCK_PUBLIC_API_KEY} userId={`${userId}`}>
      {/* Optionally, use the KnockFeedProvider to connect an in-app feed */}
      <KnockFeedProvider feedId={KNOCK_IN_APP_FEED_ID}>
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
  );
};
