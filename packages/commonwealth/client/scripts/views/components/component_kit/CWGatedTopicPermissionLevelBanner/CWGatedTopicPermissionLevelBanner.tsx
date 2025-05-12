import {
  GatedActionEnum,
  getReadableActions,
  PRODUCTION_DOMAIN,
} from '@hicommonwealth/shared';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import {
  MixpanelClickthroughEvent,
  MixpanelClickthroughPayload,
} from '../../../../../../shared/analytics/types';
import useAppStatus from '../../../../hooks/useAppStatus';
import CWBanner from '../new_designs/CWBanner';

interface CWGatedTopicPermissionLevelBannerProps {
  onClose: () => void;
  topicPermissions: GatedActionEnum[];
}

const CWGatedTopicPermissionLevelBanner = ({
  onClose = () => {},
  topicPermissions,
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
      body={`Only group members can ${getReadableActions({ actions: topicPermissions, separatorType: ',&' })}`}
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
              `https://blog.${PRODUCTION_DOMAIN}/introducing-common-groups/`,
            ),
        },
      ]}
      onClose={onClose}
    />
  );
};

export default CWGatedTopicPermissionLevelBanner;
