import moment from 'moment-twitter';
import OffchainAttachment from './OffchainAttachment';

class DiscussionDraft {
  public readonly id: number;
  public readonly author: string;
  public readonly authorChain: string;
  public readonly title: string;
  public readonly body: string;
  public readonly attachments: OffchainAttachment[];
  public readonly createdAt: moment.Moment;
  // Draft topics are not created as topic objects yet, so they are just strings
  public readonly topic: string;
  public readonly community: string;
  public readonly chain: string;

  constructor(
    author: string,
    id: number,
    community: string,
    chain: string,
    title: string,
    body: string,
    topic: string,
    createdAt: moment.Moment,
    attachments: OffchainAttachment[],
    authorChain?: string,
  ) {
    this.author = author;
    this.title = title;
    this.body = body;
    this.attachments = attachments;
    this.id = id;
    this.topic = topic;
    this.community = community;
    this.chain = chain;
    this.createdAt = createdAt;
    this.authorChain = authorChain;
  }
}

export default DiscussionDraft;
