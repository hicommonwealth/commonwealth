import { ProposalType } from 'common-common/src/types';
import type moment from 'moment';
import type { VersionHistory } from '../controllers/server/threads';
import type Attachment from './Attachment';
import type { IUniqueId } from './interfaces';
import type Poll from './Poll';
import type { ReactionType } from './Reaction';
import type Topic from './Topic';
import type { ThreadKind, ThreadStage } from './types';

export interface IThreadCollaborator {
  address: string;
  chain: string;
}

export type AssociatedReaction = {
  id: number;
  type: ReactionType;
  address: string;
};

export enum LinkSource {
  Snapshot = 'snapshot',
  Proposal = 'proposal',
  Thread = 'thread',
  Web = 'web',
}

export type Link = {
  source: LinkSource;
  identifier: string;
  title?: string;
};

export class Thread implements IUniqueId {
  public readonly author: string;
  public collaborators?: IThreadCollaborator[];
  public chainEntities?: any[];
  public readonly authorChain: string;
  public readonly title: string;
  public readonly body: string;
  public readonly plaintext: string;
  public pinned: boolean;
  public readonly kind: ThreadKind;
  public stage: ThreadStage;
  public readonly attachments: Attachment[];
  public readOnly: boolean;

  public readonly canvasAction: string;
  public readonly canvasSession: string;
  public readonly canvasHash: string;

  // TODO: it is a bit clunky to have a numeric id and a string identifier here
  //  we should remove the number to allow the store to work.
  public readonly identifier: string;
  public readonly id: number;
  public readonly createdAt: moment.Moment;
  public readonly updatedAt: moment.Moment;
  public readonly lastCommentedOn: moment.Moment;
  public topic: Topic;
  public readonly slug = ProposalType.Thread;
  public readonly url: string;
  public readonly versionHistory: VersionHistory[];
  public readonly chain: string;
  public readonly lastEdited: moment.Moment;
  public markedAsSpamAt: moment.Moment;
  public readonly lockedAt: moment.Moment;
  public readonly hasPoll: boolean;
  public readonly polls: Poll[];
  public numberOfComments: number;
  public associatedReactions: AssociatedReaction[];
  public links: Link[];
  public readonly discord_meta: any;

  public get uniqueIdentifier() {
    return `${this.slug}_${this.identifier}`;
  }

  constructor({
    author,
    title,
    attachments,
    id,
    createdAt,
    updatedAt,
    topic,
    kind,
    stage,
    versionHistory,
    chain,
    readOnly,
    // optional args:
    body,
    plaintext,
    url,
    authorChain,
    pinned,
    collaborators,
    chainEntities,
    lastEdited,
    markedAsSpamAt,
    lockedAt,
    hasPoll,
    lastCommentedOn,
    numberOfComments,
    reactionIds,
    reactionType,
    addressesReacted,
    canvasAction,
    canvasSession,
    canvasHash,
    links,
    discord_meta,
  }: {
    author: string;
    title: string;
    attachments: Attachment[];
    id: number;
    createdAt: moment.Moment;
    updatedAt: moment.Moment;
    lastCommentedOn: moment.Moment;
    topic: Topic;
    kind: ThreadKind;
    stage: ThreadStage;
    versionHistory: VersionHistory[];
    chain: string;
    readOnly: boolean;
    body?: string;
    plaintext?: string;
    url?: string;
    authorChain?: string;
    pinned?: boolean;
    collaborators?: any[];
    chainEntities?: any[];
    lastEdited?: moment.Moment;
    markedAsSpamAt?: moment.Moment;
    lockedAt?: moment.Moment;
    hasPoll: boolean;
    polls?: Poll[];
    numberOfComments?: number;
    reactionIds?: number[];
    reactionType?: ReactionType[];
    addressesReacted?: string[];
    canvasAction?: string;
    canvasSession?: string;
    canvasHash?: string;
    links?: Link[];
    discord_meta?: any;
  }) {
    this.author = author;
    this.title = title;
    this.body = body;
    this.plaintext = plaintext;
    this.attachments = attachments;
    this.id = id;
    this.identifier = `${id}`;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.topic = topic;
    this.kind = kind;
    this.stage = stage;
    this.authorChain = authorChain;
    this.pinned = pinned;
    this.url = url;
    this.versionHistory = versionHistory;
    this.chain = chain;
    this.readOnly = readOnly;
    this.collaborators = collaborators || [];
    this.lastCommentedOn = lastCommentedOn;
    this.chainEntities = chainEntities
      ? chainEntities.map((ce) => {
          return {
            id: +ce.id,
            chain,
            type: ce.type,
            typeId: ce.type_id || ce.typeId,
            completed: ce.completed,
            author,
          };
        })
      : [];
    this.hasPoll = hasPoll;
    this.lastEdited = lastEdited;
    this.markedAsSpamAt = markedAsSpamAt;
    this.lockedAt = lockedAt;
    this.numberOfComments = numberOfComments || 0;
    this.associatedReactions = [];
    if (reactionIds) {
      for (let i = 0; i < reactionIds.length; i++) {
        this.associatedReactions.push({
          id: reactionIds[i],
          type: reactionType[i],
          address: addressesReacted[i],
        });
      }
    }
    this.canvasAction = canvasAction;
    this.canvasSession = canvasSession;
    this.canvasHash = canvasHash;
    this.links = links || [];
    this.discord_meta = discord_meta;
  }
}

export default Thread;
