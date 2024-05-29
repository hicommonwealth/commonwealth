import React, { useCallback, useEffect, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import 'components/feed.scss';

import type DashboardActivityNotification from '../../models/DashboardActivityNotification';

import { PageNotFound } from '../pages/404';
import { UserDashboardRow } from '../pages/user_dashboard/user_dashboard_row';

import { slugify } from '@hicommonwealth/shared';
import { Label as ChainEventLabel, IEventLabel } from 'chain/labelers/util';
import { getThreadActionTooltipText } from 'client/scripts/helpers/threads';
import { getProposalUrlPath } from 'client/scripts/identifiers';
import Thread from 'client/scripts/models/Thread';
import { ThreadKind, ThreadStage } from 'client/scripts/models/types';
import {
  getScopePrefix,
  useCommonNavigate,
} from 'client/scripts/navigation/helpers';
import app from 'client/scripts/state';
import Permissions from 'client/scripts/utils/Permissions';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { ThreadCard } from '../pages/discussions/ThreadCard';
// import { useRefreshMembershipQuery } from 'client/scripts/state/api/groups';

type ActivityResponse = {
  notification_id: number;
  thread: {
    id: number;
    body: string;
    plaintext: string;
    title: string;
    numberOfComments: number;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
    archived_at?: string;
    locked_at?: string;
    read_only: boolean;
    has_poll: boolean;
    kind: ThreadKind;
    stage: ThreadStage;
    marked_as_spam_at?: string;
    discord_meta?: string;
    profile_id: number;
    profile_name: string;
    profile_avatar_url?: string;
    user_id: number;
    user_address: string;
  };
  recentcomments?: [];
  category_id: string;
  community_id: string;
};

type FeedProps = {
  fetchData: () => Promise<any>;
  noFeedMessage: string;
  defaultCount?: number;
  onFetchedDataCallback?: (data: any) => DashboardActivityNotification;
  customScrollParent?: HTMLElement;
  isChainEventsRow?: boolean;
};

const DEFAULT_COUNT = 10;

export const Feed = ({
  defaultCount,
  fetchData,
  noFeedMessage,
  onFetchedDataCallback,
  customScrollParent,
  isChainEventsRow,
}: FeedProps) => {
  const navigate = useCommonNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [data, setData] = useState<
    DashboardActivityNotification[] | Thread[]
  >();
  const [labels, setLabels] = useState<(IEventLabel | undefined)[]>();
  const [currentCount, setCurrentCount] = useState<number>(
    defaultCount || DEFAULT_COUNT,
  );
  const { isLoggedIn } = useUserLoggedIn();

  const loadMore = useCallback(() => {
    return setTimeout(() => {
      setCurrentCount(
        (prevState) => prevState + (defaultCount || DEFAULT_COUNT),
      );
    }, 500);
  }, [setCurrentCount, defaultCount]);

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await fetchData();

        if (isChainEventsRow) {
          const notifications: DashboardActivityNotification[] =
            onFetchedDataCallback
              ? response.result.map((activity) =>
                  onFetchedDataCallback(activity),
                )
              : response.result;
          const filteredNotifs: DashboardActivityNotification[] = [];
          const labelsArr: (IEventLabel | undefined)[] = [];

          for (const notif of notifications) {
            if (notif.categoryId === 'chain-event') {
              try {
                const chainEvent = {
                  network: notif.eventNetwork,
                  data: notif.eventData,
                };
                const label = ChainEventLabel(notif.communityId, chainEvent);
                filteredNotifs.push(notif);
                labelsArr.push(label);
              } catch (e) {
                console.warn(e);
              }
            } else {
              filteredNotifs.push(notif);
              labelsArr.push(undefined);
            }
          }

          setData(filteredNotifs);
          setLabels(labelsArr);
        } else {
          const threads = (response?.result || []).map(
            (x: ActivityResponse) =>
              new Thread({
                id: x.thread.id,
                profile_id: x.thread.profile_id,
                avatar_url: x.thread.profile_avatar_url,
                profile_name: x.thread.profile_name,
                community_id: x.community_id,
                kind: x.thread.kind,
                last_edited: x.thread.updated_at,
                marked_as_spam_at: x.thread.marked_as_spam_at,
                recentComments: x.recentcomments,
                stage: x.thread.stage,
                title: x.thread.title,
                created_at: x.thread.created_at,
                updated_at: x.thread.updated_at,
                body: x.thread.body,
                discord_meta: x.thread.discord_meta,
                numberOfComments: x.thread.numberOfComments,
                plaintext: x.thread.plaintext,
                read_only: x.thread.read_only,
                archived_at: x.thread.archived_at,
                locked_at: x.thread.locked_at,
                has_poll: x.thread.has_poll,
                Address: {
                  address: x.thread.user_address,
                  community_id: x.community_id,
                },
                // filler values
                version_history: null,
                topic: null,
                last_commented_on: '',
                address_last_active: '',
                reaction_weights_sum: 0,
              }),
          );
          setData(threads);
        }
      } catch (err) {
        setError(true);
      }
      setLoading(false);
    };

    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="Feed">
        <Virtuoso
          customScrollParent={customScrollParent}
          totalCount={4}
          style={{ height: '100%' }}
          itemContent={(i) => (
            <UserDashboardRow
              key={i}
              isChainEventsRow={isChainEventsRow}
              showSkeleton
            />
          )}
        />
      </div>
    );
  }

  if (error) {
    return <PageNotFound message="There was an error rendering the feed." />;
  }

  if (!data || data?.length === 0) {
    return (
      <div className="Feed">
        <div className="no-feed-message">{noFeedMessage}</div>
      </div>
    );
  }

  if (currentCount > data.length) setCurrentCount(data.length);

  return (
    <div className="Feed">
      <Virtuoso
        customScrollParent={customScrollParent}
        totalCount={currentCount}
        endReached={loadMore}
        style={{ height: '100%' }}
        itemContent={(i) => {
          if (isChainEventsRow) {
            return (
              <UserDashboardRow
                key={i}
                notification={data[i]}
                label={labels[i]}
                isLoggedIn={isLoggedIn}
              />
            );
          }

          const thread = data[i] as Thread;

          const discussionLink = getProposalUrlPath(
            thread.slug,
            `${thread.identifier}-${slugify(thread.title)}`,
            false,
            thread.communityId,
          );

          const chain = app.config.chains.getById(thread.communityId);

          console.log('discussionLink => ', discussionLink);

          const disabledActionsTooltipText = getThreadActionTooltipText({
            isCommunityMember: Permissions.isCommunityMember(
              thread.communityId,
            ),
            isThreadArchived: !!thread?.archivedAt,
            isThreadLocked: !!thread?.lockedAt,
            // isThreadTopicGated: isRestrictedMembership,
            // TODO: gating check here
          });

          // const { data: memberships = [] } = useRefreshMembershipQuery({
          //   communityId: thread.communityId,
          //   address: app?.user?.activeAccount?.address,
          //   apiEnabled: !!app?.user?.activeAccount?.address,
          // });

          return (
            <ThreadCard
              key={i}
              thread={thread}
              hideReactionButton
              hideUpvotesDrawer
              layoutType="community-first"
              onCommentBtnClick={() =>
                navigate(`${discussionLink}?focusEditor=true`)
              }
              // TODO: should we show modification options
              threadHref={`${getScopePrefix()}${discussionLink}`}
              customStages={chain.customStages}
              onStageTagClick={() => {
                navigate(
                  `${
                    app.isCustomDomain() ? '' : `/${thread.communityId}`
                  }/discussions?stage=${thread.stage}`,
                );
              }}
              // onEditStart={() => navigate(`${discussionLink}`)}
              canComment={!disabledActionsTooltipText}
              disabledActionsTooltipText={disabledActionsTooltipText}
            />
          );
        }}
      />
    </div>
  );
};
