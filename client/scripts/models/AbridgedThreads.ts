import moment from 'moment-twitter';
import { IUniqueId } from './interfaces';
import OffchainTopic from './OffchainTopic';

class AbridgedThread implements IUniqueId {
  public readonly id: number;
  public readonly address: string;
  public readonly author_chain: string;
  public readonly title: string;
  public readonly created_at: moment.Moment;
  public readonly community: string;
  public readonly chain: string;
  public readonly topic: OffchainTopic;
  public readonly pinned?: boolean;
  public readonly url?: string;

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
    this.address = address;
    this.author_chain = author_chain;
    this.title = title;
    this.created_at = created_at;
    this.community = community;
    this.chain = chain;
    this.pinned = pinned;
    this.topic = topic;
    this.url = url;
  }
}

export default AbridgedThread;
