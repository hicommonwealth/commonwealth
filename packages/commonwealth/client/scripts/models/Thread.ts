import {
  Contest,
  ContestAction,
  ContestManager,
  ContestScore,
} from '@hicommonwealth/schemas';
import { ProposalType, getDecodedString } from '@hicommonwealth/shared';
import { UserProfile, addressToUserProfile } from 'models/MinimumProfile';
import moment, { Moment } from 'moment';
import { z } from 'zod';
import Comment from './Comment';
import type { ReactionType } from './Reaction';
import Topic from './Topic';
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
  reactions: any[],
  reactionIds: any[],
  reactionType: any[],
  reactionTimestamps: string[],
  reactionWeights: number[],
  addressesReacted: any[],
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

const ScoreZ = ContestScore.element.omit({
  tickerPrize: true,
});

const ContestManagerZ = ContestManager.pick({
  name: true,
  cancelled: true,
  interval: true,
});

const ContestZ = Contest.pick({
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
const ContestActionZ = ContestAction.pick({
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
}

export interface IThreadCollaborator {
  address: string;
  community_id: string;
  User: { profile: UserProfile };
}

export type AssociatedReaction = {
  id: number | string;
  type: ReactionType;
  address: string;
  updated_at: string;
  voting_weight: number;
  profile_name?: string;
  avatar_url?: string;
  last_active?: string;
};

export type AssociatedContest = {
  contest_id: number;
  contest_name: string;
  contest_address: string;
  score: {
    prize: string;
    votes: number;
    content_id: string;
    creator_address: string;
  }[];
  contest_cancelled?: boolean | null;
  thread_id: number | null | undefined;
  content_id: number;
  start_time: string;
  end_time: string;
  contest_interval: number;
};

type RecentComment = {
  id: number;
  address: string;
  text: string;
  plainText: string;
  created_at: string;
  updated_at: string;
  marked_as_spam_at?: string;
  deleted_at?: string;
  discord_meta?: string;
  profile_name?: string;
  profile_avatar_url?: string;
  user_id: string;
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
  title?: string;
  display?: LinkDisplay;
};

export class Thread implements IUniqueId {
  public readonly author: string;
  public collaborators?: IThreadCollaborator[];
  public readonly authorCommunity: string;
  public readonly title: string;
  public readonly body: string;
  public readonly plaintext: string;
  public pinned: boolean;
  public readonly kind: ThreadKind;
  public stage: ThreadStage;
  public readOnly: boolean;

  public readonly canvasSignedData: string;
  public readonly canvasMsgId: string;

  // TODO: it is a bit clunky to have a numeric id and a string identifier here
  //  we should remove the number to allow the store to work.
  public readonly identifier: string;
  public readonly id: number;
  public readonly createdAt: Moment;
  public readonly updatedAt: Moment;
  public readonly lastCommentedOn: Moment;
  public archivedAt: Moment | null;
  public topic: Topic;
  public readonly slug = ProposalType.Thread;
  public readonly url: string;
  public readonly versionHistory: ThreadVersionHistory[];
  public readonly communityId: string;
  public readonly lastEdited: Moment;

  public markedAsSpamAt: Moment;
  public readonly lockedAt: Moment;

  public readonly hasPoll: boolean;
  public numberOfComments: number;
  public associatedReactions: AssociatedReaction[];
  public associatedContests?: AssociatedContest[];
  public recentComments?: Comment<IUniqueId>[];
  public reactionWeightsSum: number;
  public links: Link[];
  public readonly discord_meta: any;
  public readonly latestActivity: Moment;
  public contentUrl: string | null;

  public readonly profile: UserProfile;

  public get uniqueIdentifier() {
    return `${this.slug}_${this.identifier}`;
  }

  constructor({
    Address,
    title,
    id,
    created_at,
    updated_at,
    topic,
    kind,
    stage,
    ThreadVersionHistories,
    community_id,
    read_only,
    body,
    plaintext,
    url,
    pinned,
    collaborators,
    last_edited,
    marked_as_spam_at,
    locked_at,
    archived_at,
    has_poll,
    last_commented_on,
    numberOfComments,
    reactions,
    reactionIds,
    reactionType,
    reactionTimestamps,
    reactionWeights,
    reaction_weights_sum,
    addressesReacted,
    reactedProfileName,
    reactedProfileAvatarUrl,
    reactedAddressLastActive,
    canvas_signed_data,
    canvas_msg_id,
    links,
    discord_meta,
    userId,
    user_id,
    profile_name,
    avatar_url,
    address_last_active,
    associatedReactions,
    associatedContests,
    recentComments,
    ContestActions,
    content_url,
  }: {
    marked_as_spam_at: string;
    title: string;
    body?: string;
    id: number;
    kind: ThreadKind;
    stage: ThreadStage;
    community_id: string;
    url?: string;
    pinned?: boolean;
    links?: Link[];
    canvas_signed_data?: string;
    canvas_msg_id?: string;
    plaintext?: string;
    collaborators?: any[];
    last_edited: string;
    locked_at: string;
    last_commented_on: string;
    created_at: string;
    updated_at: string;
    archived_at?: string;
    read_only: boolean;
    has_poll: boolean;
    numberOfComments?: number;
    topic: Topic;
    reactions?: any[]; // TODO: fix type
    reactionIds?: any[]; // TODO: fix type
    addressesReacted?: any[]; //TODO: fix type,
    reactedProfileName?: string[];
    reactedProfileAvatarUrl?: string[];
    reactedAddressLastActive?: string[];
    reactionType?: any[]; // TODO: fix type
    reactionTimestamps?: string[];
    reactionWeights?: number[];
    reaction_weights_sum: number;
    ThreadVersionHistories: ThreadVersionHistory[];
    Address: any; // TODO: fix type
    discord_meta?: any;
    userId: number;
    user_id: number;
    profile_name: string;
    avatar_url: string;
    address_last_active: string;
    associatedReactions?: AssociatedReaction[];
    associatedContests?: AssociatedContest[];
    recentComments: RecentComment[];
    ContestActions: ContestActionT[];
    content_url: string | null;
  }) {
    this.author = Address?.address;
    this.title = getDecodedString(title);
    // @ts-expect-error StrictNullChecks
    this.body = getDecodedString(body);
    // @ts-expect-error StrictNullChecks
    this.plaintext = plaintext;
    this.id = id;
    this.identifier = `${id}`;
    this.createdAt = moment(created_at);
    this.updatedAt = moment(updated_at);
    // @ts-expect-error StrictNullChecks
    this.topic = topic?.id ? new Topic({ ...(topic || {}) } as any) : null;
    this.kind = kind;
    this.stage = stage;
    this.authorCommunity = Address?.community_id;
    // @ts-expect-error StrictNullChecks
    this.pinned = pinned;
    // @ts-expect-error StrictNullChecks
    this.url = url;
    this.communityId = community_id;
    this.readOnly = read_only;
    this.collaborators = collaborators || [];
    // @ts-expect-error StrictNullChecks
    this.lastCommentedOn = last_commented_on ? moment(last_commented_on) : null;
    this.hasPoll = has_poll;
    // @ts-expect-error StrictNullChecks
    this.lastEdited = last_edited
      ? moment(last_edited)
      : this.versionHistory && this.versionHistory?.length > 1
        ? this.versionHistory[0].timestamp
        : null;
    // @ts-expect-error StrictNullChecks
    this.markedAsSpamAt = marked_as_spam_at ? moment(marked_as_spam_at) : null;
    this.archivedAt = archived_at ? moment(archived_at) : null;
    // @ts-expect-error StrictNullChecks
    this.lockedAt = locked_at ? moment(locked_at) : null;
    this.numberOfComments = numberOfComments || 0;
    // @ts-expect-error StrictNullChecks
    this.canvasSignedData = canvas_signed_data;
    // @ts-expect-error <StrictNullChecks>
    this.canvasMsgId = canvas_msg_id;
    this.links = links || [];
    this.discord_meta = discord_meta;
    this.versionHistory = ThreadVersionHistories;
    this.reactionWeightsSum = reaction_weights_sum;
    this.associatedReactions =
      associatedReactions ??
      processAssociatedReactions(
        // @ts-expect-error StrictNullChecks
        reactions,
        reactionIds,
        reactionType,
        reactionTimestamps,
        reactionWeights,
        addressesReacted,
        reactedProfileName,
        reactedProfileAvatarUrl,
        reactedAddressLastActive,
      );
    this.associatedContests = processAssociatedContests(
      associatedContests,
      ContestActions,
    );
    this.contentUrl = content_url;
    this.recentComments = (recentComments || []).map(
      (rc) =>
        new Comment({
          authorChain: this.authorCommunity,
          community_id: this.authorCommunity,
          id: rc?.id,
          thread_id: id,
          author: rc?.address,
          last_edited: rc?.updated_at ? moment(rc.updated_at) : null,
          created_at: rc?.created_at ? moment(rc?.created_at) : null,
          plaintext: rc?.plainText,
          text: rc?.text,
          Address: {
            user_id: rc?.user_id,
            address: rc?.address,
            User: {
              profile: {
                name: rc?.profile_name,
                avatar_url: rc?.profile_avatar_url,
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
          reaction_weights_sum: 0,
          canvas_signed_data: null,
          canvas_msg_id: null,
        }),
    );
    this.latestActivity = last_commented_on
      ? moment(last_commented_on)
      : moment(created_at);

    if (Address?.User) {
      this.profile = addressToUserProfile(Address);
    } else {
      this.profile = {
        userId: userId ?? user_id,
        name: profile_name,
        address: Address?.address,
        lastActive: address_last_active,
        avatarUrl: avatar_url ?? undefined,
      };
    }
  }
}

export default Thread;
