import { CommunityAlert, ThreadSubscription } from '@hicommonwealth/schemas';
import { useFlag } from 'hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useCallback, useState } from 'react';
import app from 'state';
import { useCommunityAlertsQuery } from 'state/api/trpc/subscription/useCommunityAlertsQuery';
// eslint-disable-next-line max-len
import { useRegisterClientRegistrationTokenMutation } from 'state/api/trpc/subscription/useRegisterClientRegistrationTokenMutation';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';
import { CommunityEntry } from 'views/pages/NotificationSettings/CommunityEntry';
import { getFirebaseMessagingToken } from 'views/pages/NotificationSettings/getFirebaseMessagingToken';
import { useThreadSubscriptions } from 'views/pages/NotificationSettings/useThreadSubscriptions';
import useNotificationSettings from 'views/pages/NotificationSettingsOld/useNotificationSettings';
import { z } from 'zod';
import { CWText } from '../../components/component_kit/cw_text';
import { PageLoading } from '../loading';
import { SubscriptionEntry } from './SubscriptionEntry';
import './index.scss';

type NotificationSection = 'community-alerts' | 'subscriptions';

const NotificationSettings = () => {
  const navigate = useCommonNavigate();
  const threadSubscriptions = useThreadSubscriptions();
  const communityAlerts = useCommunityAlertsQuery();
  const enableKnockPushNotifications = useFlag('knockPushNotifications');
  const registerClientRegistrationToken =
    useRegisterClientRegistrationTokenMutation();

  const communityAlertsIndex = createIndexForCommunityAlerts(
    (communityAlerts.data as unknown as ReadonlyArray<
      z.infer<typeof CommunityAlert>
    >) || [],
  );

  const { bundledSubs } = useNotificationSettings();

  const [threadsFilter, setThreadsFilter] = useState<readonly number[]>([]);
  const [section, setSection] =
    useState<NotificationSection>('community-alerts');

  const handleUnsubscribe = useCallback(
    (id: number) => {
      setThreadsFilter([...threadsFilter, id]);
    },
    [threadsFilter],
  );

  const handlePushNotificationSubscription = useCallback(() => {
    async function doAsync() {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        const token = await getFirebaseMessagingToken();
        await registerClientRegistrationToken.mutateAsync({
          id: 'none',
          token,
        });
      }
    }

    doAsync().catch(console.error);
  }, [registerClientRegistrationToken]);

  if (threadSubscriptions.isLoading) {
    return <PageLoading />;
  } else if (!app.isLoggedIn()) {
    navigate('/', { replace: true });
    return <PageLoading />;
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

        {enableKnockPushNotifications && (
          <div>
            <CWText type="h5">Push Notifications</CWText>

            <p>
              <CWButton
                label="Subscribe to Push Notifications"
                onClick={handlePushNotificationSubscription}
              />
            </p>
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
              Get updates on new threads and discussions from these communities
            </CWText>

            {Object.entries(bundledSubs)
              .sort((x, y) => x[0].localeCompare(y[0]))
              .map(([communityName]) => {
                const communityInfo = app?.config.chains.getById(communityName);
                return (
                  <CommunityEntry
                    key={communityInfo.id}
                    communityInfo={communityInfo}
                    communityAlert={communityAlertsIndex[communityInfo.id]}
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
