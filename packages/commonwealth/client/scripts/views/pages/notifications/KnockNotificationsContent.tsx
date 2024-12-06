import {
  Avatar,
  KnockFeedProvider,
  KnockProvider,
  NotificationFeed,
} from '@knocklabs/react';
import moment from 'moment';
import React from 'react';
import { smartTrim } from 'shared/utils';
import useUserStore from 'state/ui/user';
import { CWText } from '../../components/component_kit/cw_text';

const KNOCK_PUBLIC_API_KEY = process.env.KNOCK_PUBLIC_API_KEY;
const KNOCK_IN_APP_FEED_ID = process.env.KNOCK_IN_APP_FEED_ID;

export const KnockNotificationsContent = () => {
  const user = useUserStore();

  return (
    <div className="KnockNotifications">
      <KnockProvider
        apiKey={KNOCK_PUBLIC_API_KEY!}
        userId={`${user.id}`}
        userToken={user.knockJWT}
      >
        <KnockFeedProvider feedId={KNOCK_IN_APP_FEED_ID!} colorMode="light">
          <NotificationFeed
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
                        &nbsp; {title}
                      </CWText>
                      <CWText fontWeight="medium" type="h5">
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
        </KnockFeedProvider>
      </KnockProvider>
    </div>
  );
};
