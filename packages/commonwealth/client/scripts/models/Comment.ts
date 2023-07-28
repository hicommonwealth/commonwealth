import type moment from 'moment';
import type { VersionHistory } from '../controllers/server/threads';
import type { IUniqueId } from './interfaces';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class Comment<T extends IUniqueId> {
  [x: string]: any;

  public readonly chain: string;
  public readonly author: string;
  public readonly text: string;
  public readonly plaintext: string;
  public readonly id: number;
  public readonly createdAt: moment.Moment;
  public readonly authorChain?: string;
  public readonly parentComment: number;
  public readonly threadId: number;
  public readonly versionHistory: VersionHistory[];
  public readonly lastEdited: moment.Moment;
  public markedAsSpamAt: moment.Moment;
  public readonly deleted: boolean;

  public readonly canvasAction: string;
  public readonly canvasSession: string;
  public readonly canvasHash: string;
  public readonly discord_meta: any;

  constructor({
    chain,
    author,
    text,
    plaintext,
    versionHistory,
    id,
    createdAt,
    threadId,
    // optional args
    parentComment,
    authorChain,
    lastEdited, // moment.Moment
    markedAsSpamAt, // moment.Moment
    deleted,
    canvasAction,
    canvasSession,
    canvasHash,
    discord_meta,
  }) {
    this.chain = chain;
    this.author = author;
    this.text = text;
    this.plaintext = plaintext;
    this.versionHistory = versionHistory;
    this.threadId = threadId;
    this.id = id;
    this.createdAt = createdAt;
    this.parentComment = parentComment;
    this.authorChain = authorChain;
    this.lastEdited = lastEdited;
    this.markedAsSpamAt = markedAsSpamAt;
    this.deleted = deleted;
    this.canvasAction = canvasAction;
    this.canvasSession = canvasSession;
    this.canvasHash = canvasHash;
    this.discord_meta = discord_meta;
  }
}

export default Comment;
