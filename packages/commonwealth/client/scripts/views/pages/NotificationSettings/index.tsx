import { CommunityAlert, ThreadSubscription } from '@hicommonwealth/schemas';
import { getUniqueCommunities } from 'helpers/addresses';
import { useFlag } from 'hooks/useFlag';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import React, { useCallback, useState } from 'react';
import { useCommunityAlertsQuery } from 'state/api/trpc/subscription/useCommunityAlertsQuery';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';
import { PageNotFound } from 'views/pages/404';
import { CommunityEntry } from 'views/pages/NotificationSettings/CommunityEntry';
import { PushNotificationsToggle } from 'views/pages/NotificationSettings/PushNotificationsToggle';
import { useSupportsPushNotifications } from 'views/pages/NotificationSettings/useSupportsPushNotifications';
import { useThreadSubscriptions } from 'views/pages/NotificationSettings/useThreadSubscriptions';
import { z } from 'zod';
import { CWText } from '../../components/component_kit/cw_text';
import { PageLoading } from '../loading';
import { SubscriptionEntry } from './SubscriptionEntry';
import './index.scss';

type NotificationSection = 'community-alerts' | 'subscriptions';

const NotificationSettings = () => {
  const supportsPushNotifications = useSupportsPushNotifications();
  const threadSubscriptions = useThreadSubscriptions();
  const communityAlerts = useCommunityAlertsQuery();
  const enableKnockPushNotifications = useFlag('knockPushNotifications');
  const { isLoggedIn } = useUserLoggedIn();

  const communityAlertsIndex = createIndexForCommunityAlerts(
    (communityAlerts.data as unknown as ReadonlyArray<
      z.infer<typeof CommunityAlert>
    >) || [],
  );

  const [threadsFilter, setThreadsFilter] = useState<readonly number[]>([]);
  const [section, setSection] =
    useState<NotificationSection>('community-alerts');

  const handleUnsubscribe = useCallback(
    (id: number) => {
      setThreadsFilter([...threadsFilter, id]);
    },
    [threadsFilter],
  );

  if (threadSubscriptions.isLoading) {
    return <PageLoading />;
  } else if (!isLoggedIn) {
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

        {enableKnockPushNotifications && supportsPushNotifications && (
          <div>
            <CWText type="h5">Push Notifications</CWText>

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

        <CWTabsRow>
          <CWTab
            label="Community Alerts"
            isSelected={section === 'community-alerts'}
            onClick={() => setSection('community-alerts')}
          />
          <CWTab
            label="Subscriptions"
            isSelected={section === 'subscriptions'}
            onClick={() => setSection('subscriptions')}
          />
        </CWTabsRow>

        {!communityAlerts.isLoading && section === 'community-alerts' && (
          <>
            <CWText type="h4" fontWeight="semiBold" className="section-header">
              Community Alerts
            </CWText>

            <CWText className="page-subheader-text">
              Get updates on onchain activity and proposals in these
              communities.
            </CWText>

            {getUniqueCommunities().map((community) => {
              return (
                <CommunityEntry
                  key={community.id}
                  communityInfo={community}
                  communityAlert={communityAlertsIndex[community.id]}
                />
              );
            })}
          </>
        )}

        {section === 'subscriptions' && (
          <>
            <CWText type="h4" fontWeight="semiBold" className="section-header">
              Subscriptions
            </CWText>

            <CWText className="page-subheader-text">
              Manage your subscriptions to these discussions
            </CWText>

            {(threadSubscriptions.data || [])
              .filter((current) => current.Thread)
              .filter((current) => !threadsFilter.includes(current.Thread!.id!))
              .map((current) => (
                <>
                  <SubscriptionEntry
                    key={current.Thread!.id!}
                    subscription={current as z.infer<typeof ThreadSubscription>}
                    onUnsubscribe={handleUnsubscribe}
                  />
                  {/*<ThreadCard thread={current.Thread!}/>*/}
                </>
              ))}
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
