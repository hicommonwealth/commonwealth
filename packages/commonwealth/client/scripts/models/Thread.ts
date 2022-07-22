import $ from 'jquery';
import m from 'mithril';
import app from 'state';
import moment from 'moment';
import { ProposalType } from 'common-common/src/types';
import { IChainEntityKind } from 'chain-events/src';
import { IUniqueId } from './interfaces';
import { ThreadKind, ThreadStage } from './types';
import OffchainAttachment from './OffchainAttachment';
import OffchainTopic from './OffchainTopic';
import OffchainVote from './OffchainVote';
import { VersionHistory } from '../controllers/server/threads';
import { ChainEntity } from '.';
import OffchainPoll from './OffchainPoll';

// field names copied from snapshot
interface IOffchainVotingOptions {
  name: string;
  choices: string[];
}

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
  public readonly attachments: OffchainAttachment[];
  public readonly readOnly: boolean;

  // TODO: it is a bit clunky to have a numeric id and a string identifier here
  //  we should remove the number to allow the store to work.
  public readonly identifier: string;
  public readonly id: number;
  public readonly createdAt: moment.Moment;
  public readonly lastCommentedOn: moment.Moment;
  public topic: OffchainTopic;
  public readonly slug = ProposalType.Thread;
  public readonly url: string;
  public readonly versionHistory: VersionHistory[];
  public readonly chain: string;
  public readonly lastEdited: moment.Moment;
  public readonly hasPoll: boolean;
  public readonly polls: OffchainPoll[];
  public readonly linkedThreads: LinkedThreadRelation[];
  public snapshotProposal: string;

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
  }: {
    author: string;
    title: string;
    attachments: OffchainAttachment[];
    id: number;
    createdAt: moment.Moment;
    lastCommentedOn: moment.Moment;
    topic: OffchainTopic;
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
    polls?: OffchainPoll[];
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
  }
}

export default Thread;
