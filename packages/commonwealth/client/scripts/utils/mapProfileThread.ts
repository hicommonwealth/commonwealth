import Thread from '../models/Thread';
import { ThreadKind, ThreadStage } from '../models/types';

export function mapProfileThread(thread): Thread {
  return new Thread({
    Address: {
      id: 0,
      address: thread.author,
      community_id: thread.authorCommunity,
      ghost_address: false,
      is_user_default: false,
      is_banned: false,
      role: 'member',
    },
    title: thread.title,
    id: thread.id,
    created_at: thread.createdAt ?? '',
    updated_at: thread.updatedAt ?? thread.createdAt ?? '',
    topic: {
      community_id: thread.communityId,
      id: thread?.topic?.id,
      name: thread.slug,
      description: '',
      created_at: '',
      featured_in_sidebar: false,
      featured_in_new_post: false,
      group_ids: [],
      active_contest_managers: [],
      total_threads: 0,
    },
    kind: thread.kind as ThreadKind,
    stage: thread.stage as ThreadStage,
    ThreadVersionHistories: thread.versionHistory ?? [],
    community_id: thread.communityId,
    read_only: thread.readOnly,
    body: thread.body,
    content_url: thread.contentUrl || null,
    locked_at: '',
    archived_at: thread.archivedAt ?? '',
    has_poll: thread.hasPoll ?? false,
    marked_as_spam_at: '',
    discord_meta: thread.discord_meta,
    profile_name: thread.profile?.name ?? '',
    avatar_url: thread.profile?.avatarUrl ?? '',
    user_id: thread.profile?.userId ?? 0,
    userId: thread.profile?.userId ?? 0,
    last_edited: thread.lastEdited ?? '',
    last_commented_on: thread.latestActivity ?? '',
    reaction_weights_sum: thread.reactionWeightsSum ?? '0',
    address_last_active: thread.profile?.lastActive ?? '',
    address_id: 0,
    search: '',
    ContestActions: thread.associatedContests ?? [],
    numberOfComments: thread.numberOfComments,
    recentComments:
      thread.recentComments?.map((c) => ({
        id: c.id ?? 0,
        address: c.address ?? '',
        user_id: c.user_id ?? 0,
        created_at: c.created_at ?? '',
        updated_at: c.updated_at ?? '',
        profile_avatar: c.profile_avatar ?? '',
        profile_name: c.profile_name ?? '',
        body: c.body ?? '',
        content_url: c.content_url || null,
        thread_id: 0,
        address_id: 0,
        reaction_count: 0,
      })) ?? [],
  });
}
