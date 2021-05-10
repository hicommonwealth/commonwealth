import moment from 'moment';
import { IUniqueId } from './interfaces';
import { OffchainVoteOptions } from './types';

class OffchainVote {
  // public readonly id: number;
  // public readonly createdAt: moment.Moment;
  public readonly address: string;
  public readonly chain: string;
  public readonly thread_id: number;
  public option: OffchainVoteOptions;

  constructor({ address, chain, thread_id, option }) {
    // this.id = id;
    // this.createdAt = createdAt;
    this.address = address;
    this.chain = chain;
    this.thread_id = thread_id;
    this.option = option;
  }
}

export default OffchainVote;
