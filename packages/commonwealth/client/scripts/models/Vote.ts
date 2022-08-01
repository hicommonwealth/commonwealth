import moment from 'moment';

class Vote {
  public readonly id: number;
  public readonly pollId: number;
  public readonly chainId: string;
  public readonly authorChain: string;
  public readonly address: string;
  public readonly createdAt: moment.Moment;
  public option: string;

  constructor({
    id,
    poll_id,
    chain_id,
    address,
    author_chain,
    option,
    created_at,
  }) {
    this.id = id;
    this.pollId = poll_id;
    this.chainId = chain_id;
    this.address = address;
    this.authorChain = author_chain;
    this.option = option;
    this.createdAt = created_at;
  }
}

export default Vote;
