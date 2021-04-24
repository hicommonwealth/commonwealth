import $ from 'jquery';
import moment from 'moment-twitter';
import app from 'state';

import { IUniqueId } from './interfaces';
import { OffchainThreadKind, OffchainThreadStage } from './types';
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

  public offchainVotes: OffchainVote[];
  public getOffchainVoteFor(address, chain) {
    return this.offchainVotes?.find((vote) => vote.address === address && vote.chain === chain);
  }
  public async submitOffchainVote(address, chain, option) {
    const thread_id = this.id;
    try {
      await $.post(`${app.serverUrl()}/updateOffchainVote`, { thread_id, option, address, chain, jwt: app.user.jwt });
      const vote = new OffchainVote({ address, chain, thread_id, option });
      // remove any existing vote
      const existingVoteIndex = this.offchainVotes.findIndex((vote) => vote.address === address && vote.chain === chain);
      if (existingVoteIndex !== -1) this.offchainVotes.splice(existingVoteIndex, 1);
      // add new vote
      this.offchainVotes.push(vote);
      return vote;
    } catch (e) {
      // TODO: handle error
    }
  }

  constructor(
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
  ) {
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
    this.offchainVotes = []; // TODO
    this.lastEdited = lastEdited;
  }
}

export default OffchainThread;
