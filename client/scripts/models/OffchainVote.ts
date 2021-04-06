import moment from 'moment-twitter';
import { IUniqueId } from './interfaces';
import { OffchainVoteOptions } from './types';

class OffchainVote {
  public readonly id: number;
  public readonly thread_id: number;
  public choice: OffchainVoteOptions;
  public readonly createdAt: moment.Moment;

  constructor({ id, thread_id, choice, createdAt }) {
    this.id = id;
    this.thread_id = thread_id;
    this.choice = choice;
    this.createdAt = createdAt;
  }
}

export default OffchainVote;
