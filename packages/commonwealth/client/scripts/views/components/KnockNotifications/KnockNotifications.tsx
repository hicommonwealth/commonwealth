import Knock from '@knocklabs/client';
import {
  KnockFeedProvider,
  KnockProvider,
  NotificationFeedPopover,
  NotificationIconButton,
} from '@knocklabs/react';
import '@knocklabs/react-notification-feed/dist/index.css';
import React, { memo, useEffect, useRef, useState } from 'react';
import useUserStore from 'state/ui/user';
import {
  handleIconClick,
  handleMouseEnter,
  handleMouseLeave,
} from '../../menus/utils';
import { CWTooltip } from '../component_kit/new_designs/CWTooltip/CWTooltip';
import CustomNotificationCell from './CustomNotificationCell';
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

export const KnockNotifications = memo(function KnockNotifications() {
  const user = useUserStore();
  const [isVisible, setIsVisible] = useState(false);

  const notifButtonRef = useRef(null);

  useEffect(() => {
    if (!user.id || !user.isLoggedIn) {
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
  }, [user.email, user.id, user.isLoggedIn, user.knockJWT]);

  if (!user.id || !user.isLoggedIn) {
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
            <CWTooltip
              content="Notifications"
              placement="bottom"
              renderTrigger={(handleInteraction, isTooltipOpen) => (
                <div
                  onClick={(e) =>
                    handleIconClick({
                      e,
                      isMenuOpen: isVisible,
                      isTooltipOpen,
                      handleInteraction,
                      onClick: () => setIsVisible(!isVisible),
                    })
                  }
                  onMouseEnter={(e) => {
                    handleMouseEnter({
                      e,
                      isMenuOpen: isVisible,
                      handleInteraction,
                    });
                  }}
                  onMouseLeave={(e) => {
                    handleMouseLeave({
                      e,
                      isTooltipOpen,
                      handleInteraction,
                    });
                  }}
                >
                  <NotificationIconButton
                    ref={notifButtonRef}
                    onClick={() => setIsVisible(!isVisible)}
                  />
                </div>
              )}
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
