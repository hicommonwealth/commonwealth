import {
  ActionGroups,
  GatedActionEnum,
  PRODUCTION_DOMAIN,
  UserFriendlyActionMap,
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
import { CWTag } from '../new_designs/CWTag';
import './CWGatedTopicBanner.scss';

interface CWGatedTopicBannerProps {
  actionGroups: ActionGroups;
  bypassGating: boolean;
  actions?: GatedActionEnum[];
  onClose: () => any;
}

function copyKeys<T, K extends keyof T>(source: T, keys: K[]): Pick<T, K> {
  return keys.reduce(
    (result, key) => {
      result[key] = source[key];
      return result;
    },
    {} as Pick<T, K>,
  );
}

const CWGatedTopicBanner = ({
  actionGroups,
  bypassGating,
  actions = Object.values(GatedActionEnum) as GatedActionEnum[],
  onClose = () => {},
}: CWGatedTopicBannerProps) => {
  const navigate = useCommonNavigate();
  const { isAddedToHomeScreen } = useAppStatus();
  const { trackAnalytics } =
    useBrowserAnalyticsTrack<MixpanelClickthroughPayload>({
      onAction: true,
    });

  if (!actions.length) return null;
  if (bypassGating) return null;

  const actionGroupsSubset = copyKeys(actionGroups, actions);
  if (!Object.keys(actionGroupsSubset).length) return null;

  const topicGroupSet = new Set<number>([]);
  // only used when there is only 1 group
  let groupName = '';
  Object.values(actionGroupsSubset).forEach((groupMap) => {
    Object.keys(groupMap).forEach((groupId) => {
      topicGroupSet.add(parseInt(groupId));
      if (!groupName) groupName = groupMap[groupId];
    });
  });
  if (topicGroupSet.size === 0) return null;

  const buttons = [
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
  ];

  if (topicGroupSet.size === 1) {
    const gatedActions = Object.keys(actionGroupsSubset) as GatedActionEnum[];
    return (
      <div className="GatedTopicBanner">
        <CWBanner
          title="This topic is gated"
          body={
            <div>
              <div className="description">
                Join the <b>{groupName}</b> group to perform the following
                action
                {gatedActions.length > 1 ? 's' : ''}:
              </div>
              <ul>
                {gatedActions.map((action) => (
                  <li key={action}>
                    <span className="action-list">•</span>
                    <span>{UserFriendlyActionMap[action]}</span>
                  </li>
                ))}
              </ul>
            </div>
          }
          type="info"
          buttons={buttons}
          onClose={onClose}
        />
      </div>
    );
  }

  return (
    <div className="GatedTopicBanner">
      <CWBanner
        title="This topic is gated"
        body={
          <div>
            <div>
              To perform certain actions in this topic, you must join one of the
              following groups:
            </div>
            <ul>
              {(
                Object.entries(actionGroupsSubset) as [
                  GatedActionEnum,
                  Record<number, string>,
                ][]
              ).map(([action, groups]) => (
                <li key={action} style={{ marginTop: 12 }}>
                  <div className="multi-action-list">
                    <strong className="action-name">
                      {UserFriendlyActionMap[action]}:
                    </strong>
                    {Object.entries(groups).map(([groupId, groupName]) => (
                      <span key={groupId} className="group-list">
                        <CWTag label={groupName} type="referendum" />
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        }
        type="info"
        buttons={buttons}
        onClose={onClose}
      />
    </div>
  );
};

export default CWGatedTopicBanner;
