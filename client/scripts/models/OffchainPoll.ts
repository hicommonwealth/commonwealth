import app from '../state';
import OffchainVote from './OffchainVote';

class OffchainPoll {
  public readonly id: number;
  public readonly threadId: number;
  public readonly chainId: string;
  public readonly createdAt: moment.Moment;
  public readonly endsAt: moment.Moment;
  public readonly prompt: string;
  public readonly options: string[];

  private _votesNum: number;
  public get votesNum() {
    return this._votesNum;
  }

  private _votes: OffchainVote[];
  public get votes() {
    return this._votes;
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
      (vote) => vote.address === address && vote.author_chain === chain
    );
  }

  public getVotes(): OffchainVote[] {
    return null;
  }

  public setVotes(voteData) {
    const votes = voteData.map((data) => {
      const { address, author_chain, thread_id, option } = data;
      return new OffchainVote({ address, author_chain, thread_id, option });
    });
    this._votes = votes;
  }

  public async submitOffchainVote(
    authorChain: string,
    address: string,
    option: string
  ) {
    return $.post(`${app.serverUrl()}/updateOffchainVote`, {
      poll_id: this.id,
      chain_id: this.chainId,
      author_chain: authorChain,
      option,
      address,
      jwt: app.user.jwt,
    }).then((response) => {
      // TODO Graham 5/3/22: We should have a dedicated controller + store
      // to handle logic like this
      const vote = new OffchainVote(response.result);
      // Remove existing vote
      const existingVoteIndex = this.votes.findIndex(
        (v) => v.address === address && v.authorChain === authorChain
      );
      if (existingVoteIndex !== -1) {
        this.votes.splice(existingVoteIndex, 1);
      } else {
        this._votesNum += 1;
      }
      // Add new or updated vote
      this.votes.push(vote);
      return vote;
    });
  }
}

export default OffchainPoll;
