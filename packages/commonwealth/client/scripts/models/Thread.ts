import { ProposalType } from 'common-common/src/types';
import Attachment from 'models/Attachment';
import type ChainEntity from 'models/ChainEntity';
import Poll from 'models/Poll';
import type momentT from 'moment';
import moment from 'moment';
import app from 'state';
import type { ReactionType } from './Reaction';
import Topic from './Topic';
import type { IUniqueId } from './interfaces';
import type { ThreadKind, ThreadStage } from './types';
import type MinimumProfile from 'models/MinimumProfile';

export interface VersionHistory {
  author?: MinimumProfile;
  timestamp: momentT.Moment;
  body: string;
}


export interface IThreadCollaborator {
  address: string;
  chain: string;
}

export type AssociatedReaction = {
  id: number | string;
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

// a list of thread fields that are an array (only includes 1st level arrays)
// IMPORTANT: this should always be updated when thread modal updates array fields or
// api response changes
export const THREAD_ARRAY_FIELDS = [
  'collaborators',
  'chainEntities',
  'attachments',
  'versionHistory',
  'associatedReactions'
]

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
  public readonly createdAt: momentT.Moment;
  public readonly updatedAt: momentT.Moment;
  public readonly lastCommentedOn: momentT.Moment;
  public topic: Topic;
  public readonly slug = ProposalType.Thread;
  public readonly url: string;
  public readonly versionHistory: VersionHistory[];
  public readonly chain: string;
  public readonly lastEdited: momentT.Moment;

  public markedAsSpamAt: momentT.Moment;
  public archivedAt: momentT.Moment;
  public readonly lockedAt: momentT.Moment;

  public readonly hasPoll: boolean;
  public readonly polls: Poll[];
  public numberOfComments: number;
  public associatedReactions: AssociatedReaction[];
  public links: Link[];

  public get uniqueIdentifier() {
    return `${this.slug}_${this.identifier}`;
  }

  constructor({
    marked_as_spam_at,
    title,
    body,
    id,
    kind,
    stage,
    chain,
    url,
    pinned,
    links,
    canvasAction,
    canvasSession,
    canvasHash,
    plaintext,
    collaborators,
    last_edited,
    locked_at,
    last_commented_on,
    created_at,
    updated_at,
    read_only,
    has_poll,
    archived_at,
    numberOfComments,
    polls,
    Attachments,
    topic,
    reactions,
    chain_entity_meta,
    version_history,
    Address,
    reactionIds,
    addressesReacted,
    reactionType
  }: {
    marked_as_spam_at: string;
    title: string;
    body?: string;
    id: number;
    kind: ThreadKind;
    stage: ThreadStage;
    chain: string;
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
    polls?: Poll[];
    Attachments: Attachment[]; // TODO: this is to be removed
    topic: Topic;
    reactions?: any[]; // TODO: fix type
    reactionIds: any[]; // TODO: fix type
    addressesReacted: any[]; //TODO: fix type,
    reactionType: any[]; // TODO: fix type
    chain_entity_meta: any, // TODO: fix type
    version_history: any[]; // TODO: fix type
    Address: any; // TODO: fix type
  }) {
    this.author = Address.address;
    this.authorChain = Address.chain;
    this.id = id;
    this.kind = kind;
    this.stage = stage;
    this.chain = chain;
    this.url = url;
    this.pinned = pinned;
    this.canvasAction = canvasAction;
    this.canvasSession = canvasSession;
    this.canvasHash = canvasHash;
    this.plaintext = plaintext;
    this.readOnly = read_only;
    this.hasPoll = has_poll;
    this.topic = topic?.id ? new Topic({...(topic || {})} as any) : null;
    this.numberOfComments = numberOfComments || 0;
    this.links = links || [];
    this.collaborators = collaborators || [];
    this.attachments = Attachments
      ? Attachments.map((a) => new Attachment(a.url, a.description))
      : [];
    this.markedAsSpamAt = marked_as_spam_at ? moment(marked_as_spam_at) : null;
    this.title = (() => {
      try {
        return decodeURIComponent(title);
      } catch (err) {
        console.error(`Could not decode title: "${title}"`);
        return title;
      }
    })();
    this.body = (() => {
      try {
        return decodeURIComponent(body);
      } catch (err) {
        console.error(`Could not decode body: "${body}"`);
        return body;
      }
    })();
    this.associatedReactions = [];
    const tempReactionIds = (reactions ? reactions.map((r) => r.id) : reactionIds) || [];
    const tempReactionType = (reactions ? reactions.map((r) => r?.type || r?.reaction) : reactionType) || [];
    const tempAddressesReacted = (reactions ? reactions.map((r) => r?.address || r?.Address?.address) : addressesReacted) || [];
    if (
      tempReactionIds.length > 0 && (
        tempReactionIds.length === tempReactionType.length &&
        tempReactionType.length === tempAddressesReacted.length
      )
    ) {
      for (let i = 0; i < tempReactionIds.length; i++) {
        this.associatedReactions.push({
          id: tempReactionIds[i],
          type: tempReactionType[i],
          address: tempAddressesReacted[i],
        });
      }
    }
    this.chainEntities = (() => {
      const chainEntitiesProcessed: ChainEntity[] = [];
      if (chain_entity_meta) {
        for (const meta of chain_entity_meta) {
          const full_entity = Array.from(app.chainEntities.store.values())
            .flat()
            .filter((e) => e.id === meta.ce_id)[0];
          if (full_entity) {
            if (meta.title) full_entity.title = meta.title;
            chainEntitiesProcessed.push(full_entity);
          }
        }
      }

      return chainEntitiesProcessed
        ? chainEntitiesProcessed.map((ce) => {
          return {
            id: +ce.id,
            chain,
            type: ce.type,
            typeId: (ce as any).type_id || ce.typeId,
            completed: ce.completed,
            author: this.author,
          };
        })
        : [];
    })()
    this.versionHistory = (() => {
      let versionHistoryProcessed;
      if (version_history) {
        versionHistoryProcessed = version_history.map((v) => {
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
      return versionHistoryProcessed
    })();
    this.lastEdited = last_edited
      ? moment(last_edited)
      : this.versionHistory && this.versionHistory?.length > 1
        ? this.versionHistory[0].timestamp
        : null;
    this.lockedAt = locked_at ? moment(locked_at) : null;
    this.lastCommentedOn = last_commented_on ? moment(last_commented_on) : null;
    this.createdAt = moment(created_at);
    this.updatedAt = moment(updated_at);
    this.archivedAt = archived_at ? moment(archived_at) : null;
    this.polls = (polls || []).map((p) => new Poll(p))
    this.identifier = `${id}`;
  }
}

export default Thread;
