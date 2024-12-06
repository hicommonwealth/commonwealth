import Knock from '@knocklabs/client';
import {
  Avatar,
  KnockFeedProvider,
  KnockProvider,
  NotificationFeedPopover,
  NotificationIconButton,
} from '@knocklabs/react';
import '@knocklabs/react-notification-feed/dist/index.css';
import moment from 'moment';
import React, { memo, useEffect, useRef, useState } from 'react';
import { smartTrim } from 'shared/utils';
import useUserStore from 'state/ui/user';
import { CWText } from '../component_kit/cw_text';
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
            <NotificationIconButton
              ref={notifButtonRef}
              onClick={() => setIsVisible(!isVisible)}
            />
            <NotificationFeedPopover
              buttonRef={notifButtonRef}
              isVisible={isVisible}
              onClose={() => setIsVisible(false)}
              renderItem={({ item }) => {
                const author = item?.data?.author || '';
                const commentBody = item?.data?.comment_body || '';
                const title = item?.data?.title || '';
                const communityName = item?.data?.community_name || '';
                const type = item?.data?.type || '';
                const createdAt = item?.inserted_at || '';
                return (
                  <div className="container">
                    <div className="avatar">
                      <Avatar name={author} />
                    </div>
                    <div className="content-container">
                      <div className="title-container">
                        <CWText fontWeight="semiBold" type="h5">
                          {author} &nbsp;
                          {type}
                        </CWText>
                        <CWText fontWeight="regular" type="b1">
                          &nbsp;{title}
                        </CWText>
                        <CWText fontWeight="semiBold" type="h5">
                          {communityName}
                        </CWText>
                      </div>
                      <div className="content">
                        <CWText fontWeight="regular" type="b2">
                          {smartTrim(commentBody, 100)}
                        </CWText>
                      </div>
                      <div className="content">
                        <CWText fontWeight="regular" type="b2">
                          {moment(createdAt).fromNow()}
                        </CWText>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          </div>
        </KnockFeedProvider>
      </KnockProvider>
    </div>
  );
});
