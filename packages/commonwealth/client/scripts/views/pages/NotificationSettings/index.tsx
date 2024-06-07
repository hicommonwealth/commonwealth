import { CommunityAlert, ThreadSubscription } from '@hicommonwealth/schemas';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useCallback, useState } from 'react';
import app from 'state';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';
import { CommunityEntry } from 'views/pages/NotificationSettings/CommunityEntry';
import { useCommunityAlerts } from 'views/pages/NotificationSettings/useCommunityAlerts';
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
  const communityAlerts = useCommunityAlerts();

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

                if (!communityInfo?.id) return null; // handles incomplete loading case

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
