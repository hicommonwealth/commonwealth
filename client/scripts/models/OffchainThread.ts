import moment from 'moment-twitter';
import { IUniqueId } from './interfaces';
import { OffchainThreadKind, OffchainThreadStage } from './types';
import OffchainAttachment from './OffchainAttachment';
import OffchainTopic from './OffchainTopic';
import { VersionHistory } from '../controllers/server/threads';

class OffchainThread implements IUniqueId {
  public readonly author: string;
  public collaborators?: any[];
  public chainEntities?: any[];
  public readonly authorChain: string;
  public readonly title: string;
  public readonly body: string;
  public readonly plaintext: string;
  public readonly pinned: boolean;
  public readonly kind: OffchainThreadKind;
  public stage: OffchainThreadStage;
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
  public readonly versionHistory: VersionHistory[];
  public readonly community: string;
  public readonly chain: string;
  public readonly lastEdited: moment.Moment;

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
    stage: OffchainThreadStage,
    versionHistory: VersionHistory[],
    community: string,
    chain: string,
    readOnly: boolean,
    body?: string,
    plaintext?: string,
    url?: string,
    authorChain?: string,
    pinned?: boolean,
    collaborators?: any[],
    chainEntities?: any[],
    lastEdited?: moment.Moment
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
    this.stage = stage;
    this.authorChain = authorChain;
    this.pinned = pinned;
    this.url = url;
    this.versionHistory = versionHistory;
    this.community = community;
    this.chain = chain;
    this.readOnly = readOnly;
    this.collaborators = collaborators || [];
    this.chainEntities = chainEntities
      ? chainEntities.map((ce) => {
          return {
            id: +ce.id,
            type: ce.type,
            typeId: ce.type_id,
            completed: ce.completed,
          };
        })
      : [];
    this.lastEdited = lastEdited;
  }
}

export default OffchainThread;
