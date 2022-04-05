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
  public readonly community: string;
  public readonly chain: string;
  public readonly lastEdited: moment.Moment;
  public readonly linkedThreads: LinkedThreadRelation[];
  public snapshotProposal: string;

  public get uniqueIdentifier() {
    return `${this.slug}_${this.identifier}`;
  }

  public get hasOffchainPoll() {
    return this.offchainVotingEnabled;
  }

  public offchainVotingEnabled: boolean;
  public offchainVotingOptions: IOffchainVotingOptions;
  public offchainVotingNumVotes: number;
  public offchainVotingEndsAt: moment.Moment | null;
  public offchainVotes: OffchainVote[]; // lazy loaded

  public getOffchainVoteFor(chain: string, address: string) {
    return this.offchainVotes?.find(
      (vote) => vote.address === address && vote.author_chain === chain
    );
  }

  public setOffchainVotes(voteData) {
    const votes = voteData.map((data) => {
      const { address, author_chain, thread_id, option } = data;
      return new OffchainVote({ address, author_chain, thread_id, option });
    });
    this.offchainVotes = votes;
  }

  public async submitOffchainVote(
    chain: string,
    community: string,
    authorChain: string,
    address: string,
    option: string
  ) {
    const thread_id = this.id;
    return $.post(`${app.serverUrl()}/updateOffchainVote`, {
      thread_id,
      option,
      address,
      chain,
      community,
      author_chain: authorChain,
      jwt: app.user.jwt,
    }).then(() => {
      const vote = new OffchainVote({
        address,
        author_chain: authorChain,
        thread_id,
        option,
      });
      // remove any existing vote
      const existingVoteIndex = this.offchainVotes.findIndex(
        (v) => v.address === address && v.author_chain === authorChain
      );
      if (existingVoteIndex !== -1) {
        this.offchainVotes.splice(existingVoteIndex, 1);
      } else {
        this.offchainVotingNumVotes += 1;
      }
      // add new vote
      this.offchainVotes.push(vote);
      m.redraw();
      return vote;
    });
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
    community,
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
    offchainVotingEnabled,
    offchainVotingOptions,
    offchainVotingEndsAt,
    offchainVotingNumVotes,
    offchainVotes,
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
    kind: OffchainThreadKind;
    stage: OffchainThreadStage;
    versionHistory: VersionHistory[];
    community: string;
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
    offchainVotingEnabled?: boolean;
    offchainVotingOptions?: string;
    offchainVotingEndsAt?: string | moment.Moment | null;
    offchainVotingNumVotes?: number;
    offchainVotes?: OffchainVote[];
    linkedThreads: LinkedThreadRelation[];
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
    this.community = community;
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
    this.offchainVotingEnabled = offchainVotingEnabled;
    try {
      this.offchainVotingOptions = JSON.parse(offchainVotingOptions);
    } catch (e) {}
    this.snapshotProposal = snapshotProposal;
    this.offchainVotingEndsAt = offchainVotingEndsAt
      ? moment(offchainVotingEndsAt)
      : null;
    this.offchainVotingNumVotes = offchainVotingNumVotes;
    this.offchainVotes = offchainVotes || [];
    this.lastEdited = lastEdited;
    this.linkedThreads = linkedThreads || [];
  }
}

export default OffchainThread;
