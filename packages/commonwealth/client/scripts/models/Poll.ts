import $ from 'jquery';
import type moment from 'moment';
import { notifyError } from '../controllers/app/notifications';
import app from '../state';
import Vote from './Vote';

class Poll {
  public readonly id: number;
  public readonly threadId: number;
  public readonly chainId: string;
  public readonly createdAt: moment.Moment;
  public readonly endsAt: moment.Moment;
  public readonly prompt: string;
  public readonly options: string[];

  private _votes: Vote[];
  public get votes() {
    return this._votes;
  }

  public get votesNum() {
    return this._votes.length;
  }

  constructor({
    id,
    threadId,
    chainId,
    createdAt,
    endsAt,
    prompt,
    options,
    votes,
  }: {
    id: number;
    threadId: number;
    chainId: string;
    createdAt: moment.Moment;
    endsAt: moment.Moment;
    prompt: string;
    options: string[];
    votes: Vote[];
  }) {
    this.id = id;
    this.threadId = threadId;
    this.chainId = chainId;
    this.createdAt = createdAt;
    this.endsAt = endsAt;
    this.prompt = prompt;
    this.options = options;
    this._votes = votes;
  }

  public getUserVote(chain: string, address: string) {
    return (this.votes || []).find(
      (vote) => vote.address === address && vote.authorChain === chain
    );
  }

  public getVotes(): Vote[] {
    return this.votes;
  }

  // TODO: this should be optimistically redrawn => really should be represented as separate atoms
  public async submitVote(
    authorChain: string,
    address: string,
    option: string
  ) {
    const selectedOption = this.options.find((o: string) => o === option);
    if (!selectedOption) {
      notifyError('Invalid voting option');
    }
    const response = await $.post(`${app.serverUrl()}/updateVote`, {
      poll_id: this.id,
      chain_id: this.chainId,
      author_chain: authorChain,
      option: selectedOption,
      address,
      jwt: app.user.jwt,
    });
    // TODO Graham 5/3/22: We should have a dedicated controller + store
    // to handle logic like this
    const vote = new Vote(response.result);
    // Remove existing vote
    const existingVoteIndex = this.votes.findIndex(
      (v) => v.address === address && v.authorChain === authorChain
    );
    if (existingVoteIndex !== -1) {
      this.votes.splice(existingVoteIndex, 1);
    }
    // Add new or updated vote
    this.votes.push(vote);
    return vote;
  }
}

export default Poll;
