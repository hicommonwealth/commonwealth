import moment from 'moment';
import { IUniqueId } from './interfaces';

class OffchainVote {
  // public readonly id: number;
  // public readonly createdAt: moment.Moment;
  public readonly address: string;
  public readonly author_chain: string;
  public readonly thread_id: number;
  public option: string;

  constructor({ address, author_chain, thread_id, option }) {
    // this.id = id;
    // this.createdAt = createdAt;
    this.address = address;
    this.author_chain = author_chain;
    this.thread_id = thread_id;
    this.option = option;
  }
}

export default OffchainVote;
