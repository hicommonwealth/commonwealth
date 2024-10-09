import { CommunityAlert } from '@hicommonwealth/schemas';
import { useFlag } from 'hooks/useFlag';
import React, { useState } from 'react';
import { useCommunityAlertsQuery } from 'state/api/trpc/subscription/useCommunityAlertsQuery';
import { useSubscriptionPreferences } from 'state/api/trpc/subscription/useSubscriptionPreferences';
import useUserStore from 'state/ui/user';
import ScrollContainer from 'views/components/ScrollContainer';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';
import { PageNotFound } from 'views/pages/404';
import { CommentSubscriptions } from 'views/pages/NotificationSettings/CommentSubscriptions';
import { CommunityEntry } from 'views/pages/NotificationSettings/CommunityEntry';
import { PushNotificationsToggle } from 'views/pages/NotificationSettings/PushNotificationsToggle';
import { ThreadSubscriptions } from 'views/pages/NotificationSettings/ThreadSubscriptions';
import { useSupportsPushNotifications } from 'views/pages/NotificationSettings/useSupportsPushNotifications';
import { useThreadSubscriptions } from 'views/pages/NotificationSettings/useThreadSubscriptions';
import { z } from 'zod';
import { CWText } from '../../components/component_kit/cw_text';
import { PageLoading } from '../loading';
import './index.scss';

type NotificationSection =
  | 'push-notifications'
  | 'community-alerts'
  | 'threads'
  | 'comments';

const NotificationSettings = () => {
  const supportsPushNotifications = useSupportsPushNotifications();
  const threadSubscriptions = useThreadSubscriptions();
  const communityAlerts = useCommunityAlertsQuery({});
  const enableKnockPushNotifications = useFlag('knockPushNotifications');
  const user = useUserStore();
  const subscriptionPreference = useSubscriptionPreferences();

  const communityAlertsIndex = createIndexForCommunityAlerts(
    communityAlerts.data || [],
  );

  const [section, setSection] =
    useState<NotificationSection>('push-notifications');

  if (threadSubscriptions.isLoading) {
    return <PageLoading />;
  } else if (!user.isLoggedIn) {
    return <PageNotFound />;
  }

  return (
    <CWPageLayout>
      <div className="NotificationSettingsPage NotificationSettings">
        <CWText type="h3" fontWeight="semiBold" className="page-header-text">
          Notification settings
        </CWText>

        <CWText className="page-subheader-text">
          Manage the emails and alerts you receive about your activity
        </CWText>

        <ScrollContainer>
          <CWTabsRow>
            {enableKnockPushNotifications && supportsPushNotifications && (
              <CWTab
                label="Push Notifications"
                isSelected={section === 'push-notifications'}
                onClick={() => setSection('push-notifications')}
              />
            )}
            <CWTab
              label="Community"
              isSelected={section === 'community-alerts'}
              onClick={() => setSection('community-alerts')}
            />
            <CWTab
              label="Threads"
              isSelected={section === 'threads'}
              onClick={() => setSection('threads')}
            />

            <CWTab
              label="Comments"
              isSelected={section === 'comments'}
              onClick={() => setSection('comments')}
            />
          </CWTabsRow>
        </ScrollContainer>

        {!communityAlerts.isLoading && section === 'community-alerts' && (
          <>
            <CWText type="h4" fontWeight="semiBold" className="section-header">
              Community Alerts
            </CWText>

            <CWText className="page-subheader-text">
              Get updates on onchain activity and proposals in these
              communities.
            </CWText>

            {user.communities.map((community) => {
              return (
                <CommunityEntry
                  key={community.id}
                  id={community.id || ''}
                  name={community.name || ''}
                  iconUrl={community.iconUrl || ''}
                  alert={communityAlertsIndex[community.id]}
                />
              );
            })}
          </>
        )}

        {section === 'push-notifications' && (
          <>
            {enableKnockPushNotifications && supportsPushNotifications && (
              <div className="mt-1">
                <CWText type="h4" className="section-header">
                  Push Notifications
                </CWText>

                <div className="setting-container">
                  <div className="setting-container-left">
                    <CWText className="text-muted">
                      Turn on notifications to receive alerts on your device.
                    </CWText>
                  </div>

                  <div className="setting-container-right">
                    <PushNotificationsToggle />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {section === 'threads' && (
          <>
            <ThreadSubscriptions />
          </>
        )}

        {section === 'comments' && (
          <>
            <CommentSubscriptions />
          </>
        )}
      </div>
    </CWPageLayout>
  );
};

function createIndexForCommunityAlerts(
  communityAlerts: ReadonlyArray<z.infer<typeof CommunityAlert>>,
): Readonly<{ [id: string]: z.infer<typeof CommunityAlert> }> {
  const result: { [id: string]: z.infer<typeof CommunityAlert> } = {};
  communityAlerts.forEach(
    (current) => (result[current.community_id] = current),
  );
  return result;
}

export default NotificationSettings;
