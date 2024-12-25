import React, { useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import './feed.scss';

import { PageNotFound } from '../pages/404';
import { UserDashboardRowSkeleton } from '../pages/user_dashboard/user_dashboard_row';

import { ActivityThread, PermissionEnum } from '@hicommonwealth/schemas';
import { MIN_CHARS_TO_SHOW_MORE, slugify } from '@hicommonwealth/shared';
import { extractImages } from 'client/scripts/helpers/feed';
import { getThreadActionTooltipText } from 'helpers/threads';
import useTopicGating from 'hooks/useTopicGating';
import { getProposalUrlPath } from 'identifiers';
import { Thread } from 'models/Thread';
import { ThreadKind, ThreadStage } from 'models/types';
import { useCommonNavigate } from 'navigation/helpers';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { useFetchCustomDomainQuery } from 'state/api/configuration';
import {
  useFetchGlobalActivityQuery,
  useFetchUserActivityQuery,
} from 'state/api/feeds/fetchUserActivity';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import { z } from 'zod';
import ThreadPreviewModal from '../modals/ThreadPreviewModal';
import { ThreadCard } from '../pages/discussions/ThreadCard';
import { CWModal } from './component_kit/new_designs/CWModal';

const DEFAULT_COUNT = 10;

type FeedThreadProps = {
  thread: Thread;
  onClick: () => void;
};

const FeedThread = ({ thread, onClick }: FeedThreadProps) => {
  const navigate = useCommonNavigate();
  const user = useUserStore();
  const { data: domain } = useFetchCustomDomainQuery();

  const discussionLink = getProposalUrlPath(
    thread?.slug,
    `${thread?.identifier}-${slugify(thread.title)}`,
    false,
    thread?.communityId,
  );

  const { data: community } = useGetCommunityByIdQuery({
    id: thread.communityId,
    enabled: !!thread.communityId,
  });

  const account = user.addresses?.find(
    (a) => a?.community?.id === thread?.communityId,
  );

  const { isRestrictedMembership, foundTopicPermissions } = useTopicGating({
    communityId: thread.communityId,
    userAddress: account?.address || '',
    apiEnabled: !!account?.address && !!thread.communityId,
    topicId: thread?.topic?.id || 0,
  });

  const isAdmin =
    Permissions.isSiteAdmin() ||
    Permissions.isCommunityAdmin({
      id: community?.id || '',
      adminsAndMods: community?.adminsAndMods || [],
    });

  const disabledActionsTooltipText = getThreadActionTooltipText({
    isCommunityMember: Permissions.isCommunityMember(thread.communityId),
    isThreadArchived: !!thread?.archivedAt,
    isThreadLocked: !!thread?.lockedAt,
    isThreadTopicGated: isRestrictedMembership,
  });

  const disabledCommentActionTooltipText = getThreadActionTooltipText({
    isCommunityMember: Permissions.isCommunityMember(thread.communityId),
    threadTopicInteractionRestrictions:
      !isAdmin &&
      !foundTopicPermissions?.permissions?.includes(
        PermissionEnum.CREATE_COMMENT, // on this page we only show comment option
      )
        ? foundTopicPermissions?.permissions
        : undefined,
  });

  // edge case for deleted communities with orphaned posts
  if (!community) {
    return (
      <ThreadCard thread={thread} layoutType="community-first" showSkeleton />
    );
  }

  return (
    <ThreadCard
      thread={thread}
      canReact={!disabledActionsTooltipText}
      canComment={!disabledCommentActionTooltipText}
      canUpdateThread={false} // we dont want user to update thread from here, even if they have permissions
      onStageTagClick={() => {
        navigate(
          `${
            domain?.isCustomDomain ? '' : `/${thread.communityId}`
          }/discussions?stage=${thread.stage}`,
        );
      }}
      threadHref={discussionLink}
      onCommentBtnClick={() => navigate(`${discussionLink}?focusComments=true`)}
      disabledActionsTooltipText={
        disabledCommentActionTooltipText
          ? disabledCommentActionTooltipText
          : disabledActionsTooltipText
      }
      customStages={community.custom_stages}
      hideReactionButton
      hideUpvotesDrawer
      layoutType="community-first"
      onImageClick={onClick}
      maxChars={MIN_CHARS_TO_SHOW_MORE}
      cutoffLines={4}
    />
  );
};

// TODO: Reconcile client state with query schemas
function mapThread(thread: z.infer<typeof ActivityThread>): Thread {
  return new Thread({
    Address: {
      id: 0,
      address: thread.user_address,
      community_id: thread.community_id,
      ghost_address: false,
      is_user_default: false,
      is_banned: false,
      role: 'member',
    },
    title: thread.title,
    id: thread.id,
    created_at: thread.created_at ?? '',
    updated_at: thread.updated_at ?? thread.created_at ?? '',
    topic: {
      community_id: thread.community_id,
      id: thread.topic.id,
      name: thread.topic.name,
      description: thread.topic.description,
      created_at: '',
      featured_in_sidebar: false,
      featured_in_new_post: false,
      group_ids: [],
      active_contest_managers: [],
      total_threads: 0,
    },
    kind: thread.kind as ThreadKind,
    stage: thread.stage as ThreadStage,
    ThreadVersionHistories: [],
    community_id: thread.community_id,
    read_only: thread.read_only,
    body: thread.body,
    content_url: thread.content_url || null,
    locked_at: thread.locked_at ?? '',
    archived_at: thread.archived_at ?? '',
    has_poll: thread.has_poll ?? false,
    marked_as_spam_at: thread.marked_as_spam_at ?? '',
    discord_meta: thread.discord_meta!,
    profile_name: thread.profile_name ?? '',
    avatar_url: thread.profile_avatar ?? '',
    user_id: thread.user_id,
    userId: thread.user_id,
    last_edited: thread.updated_at ?? '',
    last_commented_on: '',
    reaction_weights_sum: '0',
    address_last_active: '',
    address_id: 0,
    search: '',
    ContestActions: [],
    numberOfComments: thread.number_of_comments,
    recentComments:
      thread.recent_comments?.map((c) => ({
        id: c.id,
        address: c.address,
        user_id: c.user_id ?? 0,
        created_at: c.created_at,
        updated_at: c.updated_at,
        profile_avatar: c.profile_avatar ?? '',
        profile_name: c.profile_name ?? '',
        body: c.body,
        content_url: c.content_url || null,
        thread_id: 0,
        address_id: 0,
        reaction_count: 0,
      })) ?? [],
  });
}

type FeedProps = {
  query: typeof useFetchGlobalActivityQuery | typeof useFetchUserActivityQuery;
  defaultCount?: number;
  customScrollParent?: HTMLElement;
};

// eslint-disable-next-line react/no-multi-comp
export const Feed = ({ query, customScrollParent }: FeedProps) => {
  const {
    data: feed,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isError,
  } = query({ limit: 10 });

  const [isThreadModalOpen, setIsThreadModalOpen] = useState<boolean>(false);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);

  if (isLoading) {
    return (
      <div className="Feed">
        <Virtuoso
          customScrollParent={customScrollParent}
          totalCount={4}
          style={{ height: '100%' }}
          itemContent={(i) => <UserDashboardRowSkeleton key={i} />}
        />
      </div>
    );
  }

  if (isError) {
    return <PageNotFound message="There was an error rendering the feed." />;
  }
  const allThreads = feed?.pages
    ? feed.pages.flatMap((page) => page.results || [])
    : [];

  if (!allThreads?.length) {
    return (
      <div className="Feed">
        <div className="no-feed-message">
          Join some communities to see Activity!
        </div>
      </div>
    );
  }

  const openModal = (thread: z.infer<typeof ActivityThread>) => {
    setSelectedThread(mapThread(thread));
    setIsThreadModalOpen(true);
  };

  const closeModal = () => {
    setIsThreadModalOpen(false);
    setSelectedThread(null);
  };

  return (
    <div className="Feed">
      <Virtuoso
        overscan={50}
        customScrollParent={customScrollParent}
        totalCount={allThreads?.length || DEFAULT_COUNT}
        data={allThreads || []}
        style={{ height: '100%' }}
        itemContent={(i, thread) => (
          <FeedThread
            key={i}
            thread={mapThread(thread)}
            onClick={() => openModal(thread)}
          />
        )}
        endReached={() => {
          hasNextPage && fetchNextPage().catch(console.error);
        }}
      />
      {selectedThread && (
        <CWModal
          size="large"
          content={
            <ThreadPreviewModal
              isThreadModalOpen={isThreadModalOpen}
              onClose={() => setIsThreadModalOpen(false)}
              images={extractImages(selectedThread?.body)}
              thread={selectedThread}
            />
          }
          onClose={closeModal}
          open={isThreadModalOpen}
        />
      )}
    </div>
  );
};
