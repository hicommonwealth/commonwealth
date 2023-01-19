import { ProposalType } from 'common-common/src/types';
import type moment from 'moment';
import type { VersionHistory } from '../controllers/server/threads';
import type Attachment from './Attachment';
import type { IUniqueId } from './interfaces';
import type Poll from './Poll';
import type Topic from './Topic';
import type { ThreadKind, ThreadStage } from './types';

export interface LinkedThreadRelation {
  id: string;
  linkedThread: string;
  linkingThread: string;
}

interface IThreadCollaborator {
  address: string;
  chain: string;
}

class Thread implements IUniqueId {
  public readonly author: string;
  public collaborators?: IThreadCollaborator[];
  public chainEntities?: any[];
  public readonly authorChain: string;
  public readonly title: string;
  public readonly body: string;
  public readonly plaintext: string;
  public readonly pinned: boolean;
  public readonly kind: ThreadKind;
  public stage: ThreadStage;
  public readonly attachments: Attachment[];
  public readonly readOnly: boolean;

  // TODO: it is a bit clunky to have a numeric id and a string identifier here
  //  we should remove the number to allow the store to work.
  public readonly identifier: string;
  public readonly id: number;
  public readonly createdAt: moment.Moment;
  public readonly lastCommentedOn: moment.Moment;
  public topic: Topic;
  public readonly slug = ProposalType.Thread;
  public readonly url: string;
  public readonly versionHistory: VersionHistory[];
  public readonly chain: string;
  public readonly lastEdited: moment.Moment;
  public readonly hasPoll: boolean;
  public readonly polls: Poll[];
  public readonly linkedThreads: LinkedThreadRelation[];
  public snapshotProposal: string;
  public numberOfComments: number;

  public get uniqueIdentifier() {
    return `${this.slug}_${this.identifier}`;
  }

  constructor({
    author,
    title,
    attachments,
    id,
    createdAt,
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
    snapshotProposal,
    hasPoll,
    lastCommentedOn,
    linkedThreads,
    numberOfComments,
  }: {
    author: string;
    title: string;
    attachments: Attachment[];
    id: number;
    createdAt: moment.Moment;
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
    snapshotProposal: string;
    hasPoll: boolean;
    linkedThreads: LinkedThreadRelation[];
    polls?: Poll[];
    numberOfComments?: number;
  }) {
    this.author = author;
    this.title = title;
    this.body = body;
    this.plaintext = plaintext;
    this.attachments = attachments;
    this.id = id;
    this.identifier = `${id}`;
    this.createdAt = createdAt;
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
    this.snapshotProposal = snapshotProposal;
    this.lastEdited = lastEdited;
    this.linkedThreads = linkedThreads || [];
    this.numberOfComments = numberOfComments || 0;
  }
}

export default Thread;
