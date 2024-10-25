import * as schemas from '@hicommonwealth/schemas';
import { ProposalType, getDecodedString } from '@hicommonwealth/shared';
import { UserProfile, addressToUserProfile } from 'models/MinimumProfile';
import moment, { Moment } from 'moment';
import { z } from 'zod';
import Comment from './Comment';
import type { Topic } from './Topic';
import type { IUniqueId } from './interfaces';
import type { ThreadKind, ThreadStage } from './types';

function processAssociatedContests(
  associatedContests?: AssociatedContest[] | null,
  contestActions?: ContestActionT[] | null,
): AssociatedContest[] | [] {
  if (associatedContests) {
    /**
     * TODO: Ticket 8423, When we fix the content_id issue for 'added' contests, we should remove this deduplication
     * logic
     **/
    const uniqueContestIds = new Set<string>();

    const deduplicatedContests = associatedContests.filter((ac) => {
      const key = `${ac.contest_id}:${ac.content_id}`;
      if (!uniqueContestIds.has(key)) {
        uniqueContestIds.add(key);
        return true;
      }
      return false;
    });

    return deduplicatedContests;
  }

  if (contestActions) {
    return contestActions.map((action) => ({
      contest_id: action.Contest.contest_id,
      contest_name: action.Contest.ContestManager.name,
      contest_address: action.Contest.contest_address,
      score: action.Contest.score,
      contest_cancelled: action.Contest.ContestManager.cancelled,
      thread_id: action.thread_id,
      content_id: action.content_id,
      start_time: action.Contest.start_time,
      end_time: action.Contest.end_time,
      contest_interval: action.Contest.ContestManager.interval,
    }));
  }

  return [];
}

function emptyStringToNull(input: string) {
  return input === '' ? null : input;
}

function processAssociatedReactions(
  reactions: Array<
    z.infer<typeof schemas.Reaction> & { type?: string; address?: string }
  >,
  reactionIds: number[],
  reactionType: string[],
  reactionTimestamps: string[],
  reactionWeights: number[],
  addressesReacted: z.infer<typeof schemas.Address>[],
  reactedProfileName: string[],
  reactedProfileAvatarUrl: string[],
  reactedAddressLastActive: string[],
) {
  const temp = [];
  const tempReactionIds =
    (reactions ? reactions.map((r) => r.id) : reactionIds) || [];
  const tempReactionType =
    (reactions ? reactions.map((r) => r?.type || r?.reaction) : reactionType) ||
    [];
  const tempAddressesReacted =
    (reactions
      ? reactions.map((r) => r?.address || r?.Address?.address)
      : addressesReacted) || [];
  const tempReactionTimestamps =
    (reactions ? reactions.map((r) => r?.updated_at) : reactionTimestamps) ||
    [];

  const tempReactionWeights =
    (reactions
      ? reactions.map((r) => r.calculated_voting_weight)
      : reactionWeights) || [];

  if (
    tempReactionIds.length > 0 &&
    tempReactionIds.length === tempReactionType.length &&
    tempReactionType.length === tempAddressesReacted.length &&
    tempAddressesReacted.length === tempReactionTimestamps.length &&
    tempReactionTimestamps.length === tempReactionWeights.length
  ) {
    for (let i = 0; i < tempReactionIds.length; i++) {
      // @ts-expect-error StrictNullChecks
      temp.push({
        id: tempReactionIds[i],
        type: tempReactionType[i],
        address: tempAddressesReacted[i],
        updated_at: tempReactionTimestamps[i],
        voting_weight: tempReactionWeights[i] || 0,
        reactedProfileName: emptyStringToNull(reactedProfileName?.[i]),
        reactedProfileAvatarUrl: emptyStringToNull(
          reactedProfileAvatarUrl?.[i],
        ),
        reactedAddressLastActive: emptyStringToNull(
          reactedAddressLastActive?.[i],
        ),
      });
    }
  }
  return temp;
}

const ScoreZ = schemas.ContestScore.element.omit({
  tickerPrize: true,
});

const ContestManagerZ = schemas.ContestManager.pick({
  name: true,
  cancelled: true,
  interval: true,
});

const ContestZ = schemas.Contest.pick({
  contest_id: true,
  contest_address: true,
  end_time: true,
}).extend({
  score: ScoreZ.array(),
  ContestManager: ContestManagerZ,
  start_time: z.string(),
  end_time: z.string(),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ContestActionZ = schemas.ContestAction.pick({
  content_id: true,
  thread_id: true,
}).extend({
  Contest: ContestZ,
});

type ContestActionT = z.infer<typeof ContestActionZ>;

export interface ThreadVersionHistory {
  id: number;
  thread_id: number;
  address: string;
  body: string;
  timestamp: string;
  content_url: string;
}

export interface IThreadCollaborator {
  address: string;
  community_id: string;
  User?: { profile: UserProfile };
}

export type AssociatedReaction = z.infer<typeof schemas.ReactionView>;
export type AssociatedContest = z.infer<typeof schemas.ContestView>;

export type RecentComment = {
  id: number;
  address: string;
  text: string;
  created_at: string;
  updated_at: string;
  marked_as_spam_at?: string;
  deleted_at?: string;
  discord_meta?: string;
  profile_name?: string;
  profile_avatar?: string;
  user_id: string;
  content_url?: string | null;
};

export enum LinkSource {
  Snapshot = 'snapshot',
  Proposal = 'proposal',
  Thread = 'thread',
  Web = 'web',
  Template = 'template',
}

export enum LinkDisplay {
  inline = 'inline',
  sidebar = 'sidebar',
  both = 'both',
}

export type Link = {
  source: LinkSource;
  identifier: string;
  title?: string | null;
  display?: LinkDisplay;
};

export type ThreadView = z.infer<typeof schemas.ThreadView>;

export class Thread implements IUniqueId {
  public readonly author: string;
  public collaborators?: IThreadCollaborator[];
  public readonly authorCommunity: string;
  public readonly title: string;
  public readonly body: string;
  public pinned: boolean;
  public readonly kind: ThreadKind;
  public stage: ThreadStage;
  public readOnly: boolean;

  public readonly canvasSignedData?: string;
  public readonly canvasMsgId?: string;

  // TODO: it is a bit clunky to have a numeric id and a string identifier here
  //  we should remove the number to allow the store to work.
  public readonly identifier: string;
  public readonly id: number;
  public readonly createdAt: Moment;
  public readonly updatedAt?: Moment;
  public readonly lastCommentedOn?: Moment;
  public archivedAt?: Moment | null;
  public topic?: Topic;
  public readonly slug = ProposalType.Thread;
  public readonly url: string;
  public readonly versionHistory?: ThreadVersionHistory[] | null;
  public readonly communityId: string;
  public readonly lastEdited?: Moment;

  public markedAsSpamAt?: Moment;
  public readonly lockedAt?: Moment;

  public readonly hasPoll: boolean;
  public numberOfComments: number;
  public associatedReactions: AssociatedReaction[];
  public associatedContests?: AssociatedContest[];
  public recentComments?: Comment<IUniqueId>[];
  public reactionWeightsSum: string;
  public links: Link[];
  public readonly discord_meta?: z.infer<
    typeof schemas.DiscordMetaSchema
  > | null;
  public readonly latestActivity?: Moment;
  public contentUrl?: string | null;

  public readonly profile: UserProfile;

  public get uniqueIdentifier() {
    return `${this.slug}_${this.identifier}`;
  }

  constructor(
    t: ThreadView & {
      // TODO: fix other type variants
      numberOfComments?: number;
      number_of_comments?: number;
      reactionIds?: number[];
      addressesReacted?: z.infer<typeof schemas.Address>[];
      reactedProfileName?: string[];
      reactedProfileAvatarUrl?: string[];
      reactedAddressLastActive?: string[];
      reactionType?: string[];
      reactionTimestamps?: string[];
      reactionWeights?: number[];
      userId?: number;
      user_id?: number;
      avatar_url?: string | null;
      address_last_active?: string;
      associatedReactions?: AssociatedReaction[];
      associatedContests?: AssociatedContest[];
      recentComments?: RecentComment[];
      ContestActions?: ContestActionT[];
    },
  ) {
    this.author = t.Address?.address ?? '';
    this.title = getDecodedString(t.title!);
    this.body = getDecodedString(t.body!);
    this.id = t.id!;
    this.identifier = `${t.id}`;
    this.createdAt = moment(t.created_at);
    this.updatedAt = moment(t.updated_at);
    this.topic = t.topic ? ({ ...t.topic } as unknown as Topic) : undefined;
    this.kind = t.kind as ThreadKind;
    this.stage = t.stage! as ThreadStage;
    this.authorCommunity = t.Address?.community_id ?? '';
    this.pinned = t.pinned!;
    this.url = t.url!;
    this.communityId = t.community_id;
    this.readOnly = t.read_only ?? false;
    this.collaborators =
      t.collaborators?.map((c) => ({
        address: c.address,
        community_id: c.community_id,
        User: c.User
          ? {
              profile: {
                userId: c.User.id!,
                name: c.User.profile.name ?? '',
                address: c.address,
                lastActive: c.last_active?.toISOString() ?? '',
                avatarUrl: c.User.profile.avatar_url ?? '',
              },
            }
          : undefined,
      })) ?? [];
    this.lastCommentedOn = t.last_commented_on
      ? moment(t.last_commented_on)
      : undefined;
    this.hasPoll = t.has_poll ?? false;
    this.lastEdited = t.last_edited
      ? moment(t.last_edited)
      : this.versionHistory && this.versionHistory?.length > 1
        ? moment(this.versionHistory[0].timestamp)
        : t.updated_at
          ? moment(t.updated_at)
          : undefined;
    this.markedAsSpamAt = t.marked_as_spam_at
      ? moment(t.marked_as_spam_at)
      : undefined;
    this.archivedAt = t.archived_at ? moment(t.archived_at) : null;
    this.lockedAt = t.locked_at ? moment(t.locked_at) : undefined;
    this.numberOfComments =
      t.numberOfComments ?? t.number_of_comments ?? t.comment_count ?? 0;
    this.canvasSignedData = t.canvas_signed_data ?? undefined;
    this.canvasMsgId = t.canvas_msg_id ?? undefined;
    this.links = t.links || [];
    this.discord_meta = t.discord_meta;
    this.versionHistory = t.ThreadVersionHistories
      ? (t.ThreadVersionHistories as unknown as ThreadVersionHistory[])
      : null;
    this.reactionWeightsSum = t.reaction_weights_sum ?? '';
    this.associatedReactions =
      t.associatedReactions ??
      processAssociatedReactions(
        t.reactions!,
        t.reactionIds!,
        t.reactionType!,
        t.reactionTimestamps!,
        t.reactionWeights!,
        t.addressesReacted!,
        t.reactedProfileName!,
        t.reactedProfileAvatarUrl!,
        t.reactedAddressLastActive!,
      );
    this.associatedContests = processAssociatedContests(
      t.associatedContests,
      t.ContestActions,
    );
    this.contentUrl = t.content_url;
    this.recentComments = (t.recentComments || []).map(
      (rc) =>
        new Comment({
          authorChain: this.authorCommunity,
          community_id: this.authorCommunity,
          id: rc?.id,
          thread_id: t.id,
          author: rc?.address,
          last_edited: rc?.updated_at ? moment(rc.updated_at) : null,
          created_at: rc?.created_at ? moment(rc?.created_at) : null,
          text: rc?.text,
          Address: {
            user_id: rc?.user_id,
            address: rc?.address,
            User: {
              profile: {
                name: rc?.profile_name,
                avatar_url: rc?.profile_avatar,
              },
            },
          },
          discord_meta: rc?.discord_meta,
          marked_as_spam_at: rc?.marked_as_spam_at,
          deleted_at: rc?.deleted_at,
          // fallback, we are not using this in display for thread preview
          // and these should not be added here unless needed.
          parent_id: null,
          reactions: [],
          CommentVersionHistories: [],
          reaction_weights_sum: '0',
          canvas_signed_data: null,
          canvas_msg_id: null,
          content_url: rc.content_url || null,
        }),
    );
    this.latestActivity = t.last_commented_on
      ? moment(t.last_commented_on)
      : moment(t.created_at);

    if (t.Address?.User) {
      this.profile = addressToUserProfile(t.Address);
    } else {
      this.profile = {
        userId: t.userId ?? t.user_id ?? 0,
        name: t.profile_name ?? '',
        address: t.Address?.address ?? '',
        lastActive: t.address_last_active ?? '',
        avatarUrl: t.avatar_url ?? '',
      };
    }
  }
}

export default Thread;
