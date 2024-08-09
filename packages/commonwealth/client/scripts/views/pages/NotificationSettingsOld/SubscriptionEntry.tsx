import NotificationSubscription from 'models/NotificationSubscription';
import 'pages/notification_settings/index.scss';
import React from 'react';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { CWCheckbox } from '../../components/component_kit/cw_checkbox';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { CWText } from '../../components/component_kit/cw_text';
import { CWToggle } from '../../components/component_kit/cw_toggle';

type SubscriptionEntryProps = {
  communitId: string;
  subscriptions: NotificationSubscription[];
  showSubscriptionsCount?: boolean;
  canToggleEmailNotifications?: boolean;
  areEmailNotificationsEnabled?: boolean;
  onToggleReceiveEmailsNotifications: () => void;
  canToggleInAppNotifications?: boolean;
  areInAppNotificationsEnabled?: boolean;
  onToggleReceiveInAppNotifications: () => void;
};

const SubscriptionEntry = ({
  communitId,
  subscriptions,
  showSubscriptionsCount,
  canToggleEmailNotifications = true,
  areEmailNotificationsEnabled,
  onToggleReceiveEmailsNotifications,
  areInAppNotificationsEnabled,
  canToggleInAppNotifications = true,
  onToggleReceiveInAppNotifications,
}: SubscriptionEntryProps) => {
  const { data: communityInfo } = useGetCommunityByIdQuery({
    id: communitId,
    enabled: !!communitId,
  });

  return (
    <div className="notification-row chain-events-subscriptions-padding">
      <div className="notification-row-header">
        <div className="left-content-container">
          <div className="avatar-and-name">
            <CWCommunityAvatar
              size="medium"
              community={{
                iconUrl: communityInfo?.icon_url || '',
                name: communityInfo?.name || '',
              }}
            />
            <CWText type="h5" fontWeight="medium">
              {communityInfo?.name}
            </CWText>
          </div>
          {showSubscriptionsCount && (
            <CWText type="b2" className="subscriptions-count-text">
              {subscriptions.length} subscriptions
            </CWText>
          )}
        </div>
        <CWCheckbox
          label="Receive Emails"
          disabled={!canToggleEmailNotifications}
          checked={areEmailNotificationsEnabled}
          onChange={() => onToggleReceiveEmailsNotifications()}
        />
        <CWToggle
          disabled={!canToggleInAppNotifications}
          checked={areInAppNotificationsEnabled}
          onChange={() => onToggleReceiveInAppNotifications()}
        />
      </div>
    </div>
  );
};

export default SubscriptionEntry;
