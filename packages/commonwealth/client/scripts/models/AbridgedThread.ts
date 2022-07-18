import moment from 'moment';
import { ProposalType } from 'types';
import { IUniqueId } from './interfaces';
import OffchainTopic from './OffchainTopic';

class AbridgedThread implements IUniqueId {
  public readonly id: number;
  public readonly address: string;
  public readonly addressId: number;
  public readonly authorChain: string;
  public readonly title: string;
  public readonly createdAt: moment.Moment;
  public readonly chain: string;
  public readonly topic?: OffchainTopic;
  public readonly pinned?: boolean;
  public readonly url?: string;

  public readonly slug = ProposalType.OffchainThread;
  public readonly identifier: string;

  public get uniqueIdentifier() {
    return `${this.slug}_${this.identifier}`;
  }

  constructor(
    id: number,
    address_id: number,
    address: string,
    author_chain: string,
    title: string,
    created_at: moment.Moment,
    chain: string,
    topic: any,
    pinned?: boolean,
    url?: string
  ) {
    this.id = id;
    this.identifier = `${id}`;
    this.addressId = address_id;
    this.address = address;
    this.authorChain = author_chain;
    this.title = title;
    this.createdAt = created_at;
    this.chain = chain;
    this.topic = topic;
    this.pinned = pinned;
    this.url = url;
  }
}

export default AbridgedThread;
