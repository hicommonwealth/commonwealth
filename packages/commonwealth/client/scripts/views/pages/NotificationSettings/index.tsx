import { ThreadSubscription } from '@hicommonwealth/schemas';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useCallback, useState } from 'react';
import app from 'state';
import { CWCommunityAvatar } from 'views/components/component_kit/cw_community_avatar';
import { CWToggle } from 'views/components/component_kit/cw_toggle';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';
import { useCommunityAlerts } from 'views/pages/NotificationSettings/useCommunityAlerts';
import { useThreadSubscriptions } from 'views/pages/NotificationSettings/useThreadSubscriptions';
import useNotificationSettings from 'views/pages/notification_settings/useNotificationSettings';
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

        {section === 'community-alerts' && (
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
                  <div key={communityInfo?.id} className="notification-row">
                    <div className="notification-row-header">
                      <div className="left-content-container">
                        <div className="avatar-and-name">
                          <CWCommunityAvatar
                            size="medium"
                            community={communityInfo}
                          />
                          <CWText type="h5" fontWeight="medium">
                            {communityInfo?.name}
                          </CWText>

                          <div style={{ marginLeft: 'auto' }}>
                            <CWToggle />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
              .filter((current) => !threadsFilter.includes(current.Thread.id))
              .map((current) => (
                <>
                  <SubscriptionEntry
                    key={current.Thread.id}
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

export default NotificationSettings;
