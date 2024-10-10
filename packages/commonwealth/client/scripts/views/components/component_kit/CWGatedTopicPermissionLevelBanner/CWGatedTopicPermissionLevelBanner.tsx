import { GroupTopicPermissionEnum } from '@hicommonwealth/schemas';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { TOPIC_PERMISSIONS } from 'views/pages/CommunityGroupsAndMembers/Groups/common/GroupForm/constants';
import {
  MixpanelClickthroughEvent,
  MixpanelClickthroughPayload,
} from '../../../../../../shared/analytics/types';
import useAppStatus from '../../../../hooks/useAppStatus';
import CWBanner from '../new_designs/CWBanner';

interface CWGatedTopicPermissionLevelBannerProps {
  onClose: () => void;
  topicPermission: GroupTopicPermissionEnum;
}

const CWGatedTopicPermissionLevelBanner = ({
  onClose = () => {},
  topicPermission,
}: CWGatedTopicPermissionLevelBannerProps) => {
  const navigate = useCommonNavigate();

  const { isAddedToHomeScreen } = useAppStatus();

  const { trackAnalytics } =
    useBrowserAnalyticsTrack<MixpanelClickthroughPayload>({
      onAction: true,
    });

  return (
    <CWBanner
      title="This topic has granular permissioning enabled"
      body={`Topic members are only allowed to ${TOPIC_PERMISSIONS[topicPermission]}`}
      type="info"
      buttons={[
        {
          label: 'See all groups',
          onClick: () => {
            trackAnalytics({
              event: MixpanelClickthroughEvent.VIEW_THREAD_TO_MEMBERS_PAGE,
              isPWA: isAddedToHomeScreen,
            });
            navigate('/members?tab=groups');
          },
        },
        {
          label: 'Learn more about gating',
          onClick: () =>
            window.open(
              `https://blog.commonwealth.im/introducing-common-groups/`,
            ),
        },
      ]}
      onClose={onClose}
    />
  );
};

export default CWGatedTopicPermissionLevelBanner;
