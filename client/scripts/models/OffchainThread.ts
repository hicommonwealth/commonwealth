import $ from 'jquery';
import m from 'mithril';
import app from 'state';
import moment from 'moment';
import { ProposalType } from 'types';
import { IChainEntityKind } from '@commonwealth/chain-events';
import { IUniqueId } from './interfaces';
import { OffchainThreadKind, OffchainThreadStage } from './types';
import OffchainAttachment from './OffchainAttachment';
import OffchainTopic from './OffchainTopic';
import OffchainVote from './OffchainVote';
import { VersionHistory } from '../controllers/server/threads';
import { ChainEntity } from '.';
import AddressInfo from './AddressInfo';
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
class OffchainThread implements IUniqueId {
  public readonly author: string;
  public collaborators?: IThreadCollaborator[];
  public chainEntities?: any[];
  public readonly authorChain: string;
  public readonly title: string;
  public readonly body: string;
  public readonly plaintext: string;
  public readonly pinned: boolean;
  public readonly kind: OffchainThreadKind;
  public stage: OffchainThreadStage;
  public readonly attachments: OffchainAttachment[];
  public readonly readOnly: boolean;

  // TODO: it is a bit clunky to have a numeric id and a string identifier here
  //  we should remove the number to allow the store to work.
  public readonly identifier: string;
  public readonly id: number;
  public readonly createdAt: moment.Moment;
  public readonly lastCommentedOn: moment.Moment;
  public topic: OffchainTopic;
  public readonly slug = ProposalType.OffchainThread;
  public readonly url: string;
  public readonly versionHistory: VersionHistory[];
  public readonly chain: string;
  public readonly lastEdited: moment.Moment;
  public readonly hasPoll: boolean;
  public readonly polls: OffchainPoll[];
  public readonly linkedThreads: LinkedThreadRelation[];
  public snapshotProposal: string;
  public readonly addressInfo: AddressInfo;

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
    address,
  }: {
    author: string;
    title: string;
    attachments: OffchainAttachment[];
    id: number;
    createdAt: moment.Moment;
    lastCommentedOn: moment.Moment;
    topic: OffchainTopic;
    kind: OffchainThreadKind;
    stage: OffchainThreadStage;
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
    address: {[key: string]: any};
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
    this.addressInfo = new AddressInfo(
      address?.id, 
      address?.address, 
      address?.chain, 
      address?.keytype, 
      address?.wallet_id, 
      address?.ghost_address
    )
  }

  public static fromJSON({
    title,
    body,
    created_at,
    updated_at,
    chain,
    pinned,
    kind,
    url,
    version_history,
    read_only,
    plaintext,
    stage,
    offchain_voting_ends_at,
    offchain_voting_votes,
    offchain_voting_options,
    snapshot_proposal,
    offchain_voting_enabled,
    last_commented_on,
    Address,
  }) {
    return new OffchainThread({
      title,
      createdAt: created_at,
      kind,
      stage,
      versionHistory: version_history,
      chain,
      readOnly: read_only,
      body,
      plaintext,
      url,
      pinned,
      lastEdited: updated_at,
      snapshotProposal: snapshot_proposal,
      offchainVotingEnabled: offchain_voting_enabled,
      offchainVotingOptions: offchain_voting_options,
      offchainVotingEndsAt: offchain_voting_ends_at,
      offchainVotingNumVotes: offchain_voting_votes,
      lastCommentedOn: last_commented_on,
      address: Address,
    })  
  }

}

export default OffchainThread;
