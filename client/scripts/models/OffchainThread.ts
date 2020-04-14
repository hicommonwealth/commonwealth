import moment from 'moment-twitter';
import { IUniqueId } from './interfaces';
import { OffchainThreadKind } from './types';
import OffchainAttachment from './OffchainAttachment';
import OffchainTag from './OffchainTag';

class OffchainThread implements IUniqueId {
  public readonly author: string;
  public readonly authorChain: string;
  public readonly title: string;
  public readonly body: string;
  public readonly pinned: boolean;
  public readonly kind: OffchainThreadKind;
  public readonly attachments: OffchainAttachment[];

  // TODO: it is a bit clunky to have a numeric id and a string identifier here
  //  we should remove the number to allow the store to work.
  public readonly identifier: string;
  public readonly id: number;
  public readonly createdAt: moment.Moment;
  public readonly tags: OffchainTag[];
  public readonly slug = 'discussion';
  public readonly url: string;
  public readonly versionHistory: string[];
  public readonly community: string | number;
  public readonly privacy?: boolean;
  public readonly readOnly?: boolean;

  public get uniqueIdentifier() {
    return `${this.slug}_${this.identifier}`;
  }

  constructor(
    author: string,
    title: string,
    attachments: OffchainAttachment[],
    id: number,
    createdAt: moment.Moment,
    tags: OffchainTag[],
    kind: OffchainThreadKind,
    versionHistory: string[],
    community: number | string,
    body?: string,
    url?: string,
    authorChain?: string,
    pinned?: boolean,
    privacy?: boolean,
    readOnly?: boolean,

  ) {
    this.author = author;
    this.title = title;
    this.body = body;
    this.attachments = attachments;
    this.id = id;
    this.identifier = '' + id;
    this.createdAt = createdAt;
    this.tags = tags;
    this.kind = kind;
    this.authorChain = authorChain;
    this.pinned = pinned;
    this.url = url;
    this.versionHistory = versionHistory;
    this.community = community;
    this.privacy = privacy;
    this.readOnly = readOnly;
  }
}

export default OffchainThread;
