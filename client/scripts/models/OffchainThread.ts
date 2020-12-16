import moment from 'moment-twitter';
import { IUniqueId } from './interfaces';
import { OffchainThreadKind } from './types';
import OffchainAttachment from './OffchainAttachment';
import OffchainTopic from './OffchainTopic';

class OffchainThread implements IUniqueId {
  public readonly author: string;
  public readonly authorChain: string;
  public readonly title: string;
  public readonly body: string;
  public readonly plaintext: string;
  public readonly pinned: boolean;
  public readonly kind: OffchainThreadKind;
  public readonly attachments: OffchainAttachment[];
  public readonly readOnly: boolean;

  // TODO: it is a bit clunky to have a numeric id and a string identifier here
  //  we should remove the number to allow the store to work.
  public readonly identifier: string;
  public readonly id: number;
  public readonly createdAt: moment.Moment;
  public topic: OffchainTopic;
  public readonly slug = 'discussion';
  public readonly url: string;
  public readonly versionHistory: string[];
  public readonly community: string;
  public readonly chain: string;

  public get uniqueIdentifier() {
    return `${this.slug}_${this.identifier}`;
  }

  constructor(
    author: string,
    title: string,
    attachments: OffchainAttachment[],
    id: number,
    createdAt: moment.Moment,
    topic: OffchainTopic,
    kind: OffchainThreadKind,
    versionHistory: string[],
    community: string,
    chain: string,
    readOnly: boolean,
    body?: string,
    plaintext?: string,
    url?: string,
    authorChain?: string,
    pinned?: boolean,
  ) {
    this.author = author;
    this.title = title;
    this.body = body;
    this.plaintext = plaintext;
    this.attachments = attachments;
    this.id = id;
    this.identifier = `${id}`;
    this.createdAt = createdAt;
    this.topic = topic;
    this.kind = kind;
    this.authorChain = authorChain;
    this.pinned = pinned;
    this.url = url;
    this.versionHistory = versionHistory;
    this.community = community;
    this.chain = chain;
    this.readOnly = readOnly;
  }
}

export default OffchainThread;
