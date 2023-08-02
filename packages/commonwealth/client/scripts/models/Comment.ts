import type momentType from 'moment';
import moment from 'moment';
import type { VersionHistory } from '../controllers/server/threads';
import AddressInfo from './AddressInfo';
import Reaction from './Reaction';
import type { IUniqueId } from './interfaces';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class Comment<T extends IUniqueId> {
  [x: string]: any;

  public readonly chain: string;
  public readonly author: string;
  public readonly Address: AddressInfo;
  public readonly text: string;
  public readonly plaintext: string;
  public readonly reactions: Reaction[];
  public readonly id: number;
  public readonly created_at: momentType.Moment;
  public readonly authorChain?: string;
  public readonly parentComment: number;
  public readonly threadId: number;
  public readonly version_history: VersionHistory[];
  public readonly lastEdited: string;
  public markedAsSpamAt: momentType.Moment;
  public readonly deleted: boolean;
  public readonly rootThread: string;
  public readonly parentId: number;
  public readonly deletedAt: any;

  public readonly canvasAction: string;
  public readonly canvasSession: string;
  public readonly canvasHash: string;
  public readonly discord_meta: any;

  constructor({
    id,
    text,
    chain,
    author,
    Address,
    thread_id,
    parent_id,
    plaintext,
    reactions,
    created_at,
    deleted_at,
    authorChain,
    version_history,
    last_edited,
    canvas_hash,
    canvas_action,
    canvas_session,
    marked_as_spam_at,
    discord_meta,
  }) {
    const versionHistory = version_history
      ? version_history.map((v) => {
          if (!v) return;
          let history;
          try {
            history = JSON.parse(v || '{}');
            history.author =
              typeof history.author === 'string'
                ? JSON.parse(history.author)
                : typeof history.author === 'object'
                ? history.author
                : null;
            history.timestamp = moment(history.timestamp);
          } catch (e) {
            console.log(e);
          }
          return history;
        })
      : [];

    this.chain = chain;
    this.author = Address?.address || author;
    this.text = deleted_at?.length > 0 ? '[deleted]' : decodeURIComponent(text);
    this.plaintext = deleted_at?.length > 0 ? '[deleted]' : plaintext;
    this.versionHistory = versionHistory;
    this.threadId = thread_id;
    this.id = id;
    this.createdAt = moment(created_at);
    this.parentComment = Number(parent_id) || null;
    this.authorChain = Address?.chain || authorChain;
    this.lastEdited = last_edited
      ? moment(last_edited)
      : versionHistory && versionHistory?.length > 1
      ? versionHistory[0].timestamp
      : null;
    this.markedAsSpamAt = marked_as_spam_at ? moment(marked_as_spam_at) : null;
    this.deleted = deleted_at?.lnegth > 0 ? true : false;
    this.canvasAction = canvas_action;
    this.canvasSession = canvas_session;
    this.canvasHash = canvas_hash;
    this.reactions = (reactions || []).map((r) => new Reaction(r));
    this.rootThread = thread_id;
    this.discord_meta = discord_meta;
  }
}

export default Comment;
