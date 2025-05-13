import {
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

interface Group {
  id: number;
  name: string;
  topics: { id: number; permissions: GatedActionEnum[] }[];
}

interface Memberships {
  groupId: number;
  topics: { id: number; permissions: GatedActionEnum[] }[];
  isAllowed: boolean;
}

interface CWGatedTopicBannerProps {
  groups: Group[];
  memberships: Memberships[];
  topicId?: number;
  actions?: GatedActionEnum[];
  onClose: () => any;
}

const CWGatedTopicBanner = ({
  actions = Object.values(GatedActionEnum) as GatedActionEnum[],
  groups = [],
  memberships = [],
  topicId,
  onClose = () => {},
}: CWGatedTopicBannerProps) => {
  const navigate = useCommonNavigate();
  const { isAddedToHomeScreen } = useAppStatus();
  const { trackAnalytics } =
    useBrowserAnalyticsTrack<MixpanelClickthroughPayload>({
      onAction: true,
    });

  if (!topicId) return null;
  if (!actions.length) return null;

  // Build a map of groupId -> isMember from memberships
  const membershipMap = new Map<number, boolean>();
  memberships?.forEach((m) => {
    membershipMap.set(m.groupId, m.isAllowed);
  });

  const actionsSet = new Set(actions);
  const topicGroupSet = new Set<number>([]);

  // actionGroups stores groups (by action) that:
  //  - are relevant to the current topic
  //  - have a gated actions that match the given actions (e.g. CREATE_THREAD)
  //  - the user is not a member of
  // This group info is presented to the user to let them know what groups they need to join
  // to perform specific actions.
  // const actionGroups = new Map<GatedActionEnum, Record<number, string>>();
  const actionGroups: Partial<Record<GatedActionEnum, Record<number, string>>> =
    {};
  for (const group of groups) {
    for (const topic of group.topics) {
      if (topic.id === topicId) {
        const topicActions = new Set(topic.permissions);
        const intersection = actionsSet.intersection(topicActions);
        if (intersection.size > 0 && !membershipMap.get(group.id)) {
          topicGroupSet.add(group.id);
          for (const action of intersection) {
            if (!actionGroups[action]) {
              actionGroups[action] = { [group.id]: group.name };
            }
            if (!actionGroups[action][group.id])
              actionGroups[action][group.id] = group.name;
          }
        }
        break;
      }
    }
  }

  if (!Object.keys(actionGroups).length) return null;

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
    const groupId = Array.from(topicGroupSet)[0];
    const groupName = groups.find((g) => g.id === groupId)?.name;
    // Collect all actions gated by this group (from actionGroups)
    const gatedActions: GatedActionEnum[] = Object.entries(actionGroups)
      .filter(([, groupMap]) => groupMap[groupId])
      .map(([action]) => action as GatedActionEnum);

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
                Object.entries(actionGroups) as [
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
