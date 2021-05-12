import $ from 'jquery';
import m from 'mithril';
import app from 'state';
import moment from 'moment';

import { IUniqueId } from './interfaces';
import { OffchainThreadKind, OffchainThreadStage, OffchainVoteOptions } from './types';
import OffchainAttachment from './OffchainAttachment';
import OffchainTopic from './OffchainTopic';
import OffchainVote from './OffchainVote';
import { VersionHistory } from '../controllers/server/threads';

class OffchainThread implements IUniqueId {
  public readonly author: string;
  public collaborators?: any[];
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
  public topic: OffchainTopic;
  public readonly slug = 'discussion';
  public readonly url: string;
  public readonly versionHistory: VersionHistory[];
  public readonly community: string;
  public readonly chain: string;
  public readonly lastEdited: moment.Moment;

  public get uniqueIdentifier() {
    return `${this.slug}_${this.identifier}`;
  }

  private _hasOffchainPoll: boolean;
  public get hasOffchainPoll() {
    return true;
    // return _hasOffchainPoll;
  }

  public offchainVotingNumVotes: number;
  public offchainVotingEnabledAt: moment.Moment | null;
  public offchainVotes: OffchainVote[]; // lazy loaded
  public getOffchainVoteFor(chain: string, address: string) {
    return this.offchainVotes?.find((vote) => vote.address === address && vote.author_chain === chain);
  }
  public setOffchainVotes(voteData) {
    const votes = voteData.map((data) => {
      const { address, author_chain, thread_id, option } = data;
      return new OffchainVote({ address, author_chain, thread_id, option: +option });
    });
    this.offchainVotes = votes;
  }
  public async submitOffchainVote(chain: string, address: string, option: OffchainVoteOptions) {
    const thread_id = this.id;
    try {
      await $.post(`${app.serverUrl()}/updateOffchainVote`, {
        thread_id,
        option,
        address,
        chain, // chain is not really needed except we are conducting an unnecessary backend check
        author_chain: chain,
        jwt: app.user.jwt
      });
      const vote = new OffchainVote({ address, author_chain: chain, thread_id, option });
      // remove any existing vote
      const existingVoteIndex = this.offchainVotes.findIndex((v) => v.address === address && v.author_chain === chain);
      if (existingVoteIndex !== -1) {
        this.offchainVotes.splice(existingVoteIndex, 1);
      } else {
        this.offchainVotingNumVotes += 1;
      }
      // add new vote
      this.offchainVotes.push(vote);
      m.redraw();
      return vote;
    } catch (e) {
      // TODO: handle error
    }
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
    offchainVotingEnabledAt,
    offchainVotingNumVotes,
    offchainVotes,
  }: {
    author: string,
    title: string,
    attachments: OffchainAttachment[],
    id: number,
    createdAt: moment.Moment,
    topic: OffchainTopic,
    kind: OffchainThreadKind,
    stage: OffchainThreadStage,
    versionHistory: VersionHistory[],
    community: string,
    chain: string,
    readOnly: boolean,
    body?: string,
    plaintext?: string,
    url?: string,
    authorChain?: string,
    pinned?: boolean,
    collaborators?: any[],
    chainEntities?: any[],
    lastEdited?: moment.Moment,
    offchainVotingEnabledAt?: moment.Moment | null,
    offchainVotingNumVotes?: number,
    offchainVotes?: OffchainVote[],
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
    this.chainEntities = chainEntities ? chainEntities.map((ce) => {
      return {
        id: +ce.id,
        type: ce.type,
        typeId: ce.type_id,
        completed: ce.completed,
      };
    }) : [];
    this.offchainVotingEnabledAt = offchainVotingEnabledAt;
    this.offchainVotingNumVotes = offchainVotingNumVotes;
    this.offchainVotes = offchainVotes || [];
    this.lastEdited = lastEdited;
  }
}

export default OffchainThread;
