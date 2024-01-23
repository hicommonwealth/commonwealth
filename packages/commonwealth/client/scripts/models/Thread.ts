import { ProposalType } from '@hicommonwealth/core';
import type MinimumProfile from 'models/MinimumProfile';
import moment, { Moment } from 'moment';
import type { ReactionType } from './Reaction';
import Topic from './Topic';
import type { IUniqueId } from './interfaces';
import type { ThreadKind, ThreadStage } from './types';

function getDecodedString(str: string) {
  try {
    return decodeURIComponent(str);
  } catch (err) {
    console.error(`Could not decode str: "${str}"`);
    return str;
  }
}

function processVersionHistory(versionHistory: any[]) {
  let versionHistoryProcessed;
  if (versionHistory) {
    versionHistoryProcessed = versionHistory.map((v) => {
      if (!v) return;
      let history;
      try {
        history = JSON.parse(v);
        history.author =
          typeof history.author === 'string'
            ? JSON.parse(history.author)
            : typeof history.author === 'object'
            ? history.author
            : null;
        history.timestamp = moment(history.timestamp);
      } catch (e) {
        console.log(e);
      }
      return history;
    });
  }
  return versionHistoryProcessed;
}

function processAssociatedReactions(
  reactions: any[],
  reactionIds: any[],
  reactionType: any[],
  addressesReacted: any[],
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
  const tempReactionTimestamps = reactions
    ? reactions.map((r) => r?.updated_at)
    : [];
  const allHaveTimestamps =
    tempReactionTimestamps.length === tempReactionIds.length;
  const tempVotingWeights = reactions
    ? reactions.map((r) => r?.calculated_voting_weight)
    : [];
  const allHaveVoteWeights =
    tempVotingWeights.length === tempReactionIds.length;

  if (
    tempReactionIds.length > 0 &&
    tempReactionIds.length === tempReactionType.length &&
    tempReactionType.length === tempAddressesReacted.length
  ) {
    for (let i = 0; i < tempReactionIds.length; i++) {
      temp.push({
        id: tempReactionIds[i],
        type: tempReactionType[i],
        address: tempAddressesReacted[i],
        updated_at: allHaveTimestamps ? tempReactionTimestamps[i] : null,
        voting_weight: allHaveVoteWeights ? tempVotingWeights[i] : 0,
      });
    }
  }
  return temp;
}

export interface VersionHistory {
  author?: MinimumProfile;
  timestamp: Moment;
  body: string;
}

export interface IThreadCollaborator {
  address: string;
  community_id: string;
}

export type AssociatedReaction = {
  id: number | string;
  type: ReactionType;
  address: string;
  updated_at: string;
  voting_weight: number;
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
  public readonly authorChain: string;
  public readonly title: string;
  public readonly body: string;
  public readonly plaintext: string;
  public pinned: boolean;
  public readonly kind: ThreadKind;
  public stage: ThreadStage;
  public readOnly: boolean;

  public readonly canvasAction: string;
  public readonly canvasSession: string;
  public readonly canvasHash: string;

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
  public readonly versionHistory: VersionHistory[];
  public readonly communityId: string;
  public readonly lastEdited: Moment;

  public markedAsSpamAt: Moment;
  public readonly lockedAt: Moment;

  public readonly hasPoll: boolean;
  public numberOfComments: number;
  public associatedReactions: AssociatedReaction[];
  public links: Link[];
  public readonly discord_meta: any;
  public readonly latestActivity: Moment;

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
    version_history,
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
    addressesReacted,
    canvasAction,
    canvasSession,
    canvasHash,
    links,
    discord_meta,
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
    canvasAction?: string;
    canvasSession?: string;
    canvasHash?: string;
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
    reactionIds: any[]; // TODO: fix type
    addressesReacted: any[]; //TODO: fix type,
    reactionType: any[]; // TODO: fix type
    version_history: any[]; // TODO: fix type
    Address: any; // TODO: fix type
    discord_meta?: any;
  }) {
    this.author = Address.address;
    this.title = getDecodedString(title);
    this.body = getDecodedString(body);
    this.plaintext = plaintext;
    this.id = id;
    this.identifier = `${id}`;
    this.createdAt = moment(created_at);
    this.updatedAt = moment(updated_at);
    this.topic = topic?.id ? new Topic({ ...(topic || {}) } as any) : null;
    this.kind = kind;
    this.stage = stage;
    this.authorChain = Address.community_id;
    this.pinned = pinned;
    this.url = url;
    this.communityId = community_id;
    this.readOnly = read_only;
    this.collaborators = collaborators || [];
    this.lastCommentedOn = last_commented_on ? moment(last_commented_on) : null;
    this.hasPoll = has_poll;
    this.lastEdited = last_edited
      ? moment(last_edited)
      : this.versionHistory && this.versionHistory?.length > 1
      ? this.versionHistory[0].timestamp
      : null;
    this.markedAsSpamAt = marked_as_spam_at ? moment(marked_as_spam_at) : null;
    this.archivedAt = archived_at ? moment(archived_at) : null;
    this.lockedAt = locked_at ? moment(locked_at) : null;
    this.numberOfComments = numberOfComments || 0;
    this.canvasAction = canvasAction;
    this.canvasSession = canvasSession;
    this.canvasHash = canvasHash;
    this.links = links || [];
    this.discord_meta = discord_meta;
    this.versionHistory = processVersionHistory(version_history);
    this.associatedReactions = processAssociatedReactions(
      reactions,
      reactionIds,
      reactionType,
      addressesReacted,
    );
    this.latestActivity = last_commented_on
      ? moment(last_commented_on)
      : moment(created_at);
  }
}

export default Thread;
