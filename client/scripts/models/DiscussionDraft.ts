import moment from 'moment-twitter';
import { IUniqueId } from './interfaces';
import OffchainAttachment from './OffchainAttachment';

class DiscussionDraft {
  public readonly id: number;
  public readonly author: string;
  public readonly authorChain: string;
  public readonly title: string;
  public readonly body: string;
  public readonly attachments: OffchainAttachment[];
  public readonly createdAt: moment.Moment;
  // Draft tags are not created as tag objects yet, so they are just strings
  public readonly tag: string;
  public readonly community: string;
  public readonly chain: string;
  public readonly slug = 'draft';

  constructor(
    author: string,
    id: number,
    community: string,
    chain: string,
    title: string,
    body: string,
    tag: string,
    attachments: OffchainAttachment[],
  ) {
    this.author = author;
    this.title = title;
    this.body = body;
    this.attachments = attachments;
    this.id = id;
    this.tag = tag;
    this.community = community;
    this.chain = chain;
  }
}

export default DiscussionDraft;
