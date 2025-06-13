import {
  KnockFeedProvider,
  KnockProvider,
  NotificationFeedPopover,
  NotificationIconButton,
} from '@knocklabs/react';
import '@knocklabs/react-notification-feed/dist/index.css';
import React, { memo, useRef, useState } from 'react';
import { useFetchPublicEnvVarQuery } from 'state/api/configuration';
import useUserStore from 'state/ui/user';
import {
  handleIconClick,
  handleMouseEnter,
  handleMouseLeave,
} from '../../menus/utils';
import { CWTooltip } from '../component_kit/new_designs/CWTooltip/CWTooltip';
import CustomNotificationCell from './CustomNotificationCell';
import './KnockNotifications.scss';

export const KnockNotifications = memo(function KnockNotifications() {
  const { data: configurationData } = useFetchPublicEnvVarQuery();

  const user = useUserStore();
  const [isVisible, setIsVisible] = useState(false);

  const notifButtonRef = useRef(null);

  return (
    <div className="KnockNotifications">
      <KnockProvider
        apiKey={configurationData!.KNOCK_PUBLIC_API_KEY}
        userId={`${user.id}`}
        userToken={user.knockJWT}
      >
        <KnockFeedProvider
          feedId={configurationData!.KNOCK_IN_APP_FEED_ID}
          colorMode="light"
        >
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
