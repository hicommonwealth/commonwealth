import moment from 'moment-twitter';
import { IUniqueId } from './interfaces';
import OffchainTopic from './OffchainTopic';

class AbridgedThread implements IUniqueId {
  public readonly id: number;
  public readonly address: string;
  public readonly authorChain: string;
  public readonly title: string;
  public readonly createdAt: moment.Moment;
  public readonly community: string;
  public readonly chain: string;
  public readonly topic: OffchainTopic;
  public readonly pinned?: boolean;
  public readonly url?: string;

  public readonly slug = 'discussion';
  public readonly identifier: string;

  public get uniqueIdentifier() {
    return `${this.slug}_${this.identifier}`;
  }

  constructor(
    id: number,
    address: string,
    author_chain: string,
    title: string,
    created_at: moment.Moment,
    community: string,
    chain: string,
    topic: OffchainTopic,
    pinned?: boolean,
    url?: string
  ) {
    this.id = id;
    this.identifier = `${id}`;
    this.address = address;
    this.authorChain = author_chain;
    this.title = title;
    this.createdAt = created_at;
    this.community = community;
    this.chain = chain;
    this.pinned = pinned;
    this.topic = topic;
    this.url = url;
  }
}

export default AbridgedThread;
