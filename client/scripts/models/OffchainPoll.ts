import OffchainVote from './OffchainVote';

class OffchainPoll {
  public readonly id: number;
  public readonly threadId: string;
  public readonly chainId: string;
  public readonly createdAt: moment.Moment;
  public readonly endsAt: moment.Moment;
  public readonly prompt: string;
  public readonly options: string[];
  public readonly votesNum: number;

  private _votes: OffchainVote[];
  public votes() {
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
    this.votes = votes;
  }

  public getOffchainVoteFor(chain: string, address: string) {
    return this.votes?.find(
      (vote) => vote.address === address && vote.author_chain === chain
    );
  }

  public setOffchainVotes(voteData) {
    const votes = voteData.map((data) => {
      const { address, author_chain, thread_id, option } = data;
      return new OffchainVote({ address, author_chain, thread_id, option });
    });
    this.votes = votes;
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
      const existingVoteIndex = this.votes.findIndex(
        (v) => v.address === address && v.author_chain === authorChain
      );
      if (existingVoteIndex !== -1) {
        this.votes.splice(existingVoteIndex, 1);
      } else {
        this.offchainVotingNumVotes += 1;
      }
      // add new vote
      this.votes.push(vote);
      m.redraw();
      return vote;
    });
  }
}

export default OffchainPoll;
