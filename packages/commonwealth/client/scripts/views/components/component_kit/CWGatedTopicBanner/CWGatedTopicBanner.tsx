import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import {
  MixpanelClickthroughEvent,
  MixpanelClickthroughPayload,
} from '../../../../../../shared/analytics/types';
import CWBanner from '../new_designs/CWBanner';
import { CWTag } from '../new_designs/CWTag';

interface CWGatedTopicBannerProps {
  groupNames: string[];
  onClose: () => any;
}

const CWGatedTopicBanner = ({
  groupNames = [],
  onClose = () => {},
}: CWGatedTopicBannerProps) => {
  const navigate = useCommonNavigate();
  const { trackAnalytics } =
    useBrowserAnalyticsTrack<MixpanelClickthroughPayload>({
      onAction: true,
    });

  return (
    <CWBanner
      title="This topic is gated"
      body="Only members within the following group(s) can interact with this topic:"
      type="info"
      footer={
        <div className="gating-tags">
          {groupNames.map((name) => (
            <CWTag key={name} label={name} type="referendum" />
          ))}
        </div>
      }
      buttons={[
        {
          label: 'See all groups',
          onClick: () => {
            trackAnalytics({
              event: MixpanelClickthroughEvent.VIEW_THREAD_TO_MEMBERS_PAGE,
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

export default CWGatedTopicBanner;
