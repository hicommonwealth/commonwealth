import moment from 'moment';

import type { SubscriptionInstance } from 'server/models/subscription';
import type ChainInfo from './ChainInfo';
import { default as CommentT } from './Comment';
import { Thread as ThreadT } from './Thread';
import type { IUniqueId } from './interfaces';

class NotificationSubscription {
  public readonly category: string;
  public readonly objectId: string;
  public readonly createdAt: moment.Moment;
  public readonly Chain: ChainInfo;
  public readonly Comment: CommentT<IUniqueId>;
  public readonly Thread: ThreadT;

  public readonly id?: number;
  public readonly chainEntityId?: any;

  private _immediateEmail: boolean;
  public get immediateEmail() {
    return this._immediateEmail;
  }

  public enableImmediateEmail() {
    this._immediateEmail = true;
  }

  public disableImmediateEmail() {
    this._immediateEmail = false;
  }

  private _isActive: boolean;
  public get isActive() {
    return this._isActive;
  }

  // TODO: should resolve Chain vs chain
  public get getChain() {
    return this.Chain.id || this.Chain;
  }

  public enable() {
    this._isActive = true;
  }

  public disable() {
    this._isActive = false;
  }

  constructor(
    id,
    category,
    objectId,
    isActive,
    createdAt,
    immediateEmail,
    Chain?,
    comment?: CommentT<IUniqueId>,
    thread?: ThreadT
  ) {
    this.id = id;
    this.category = category;
    this.objectId = objectId;
    this._isActive = isActive;
    this.createdAt = moment(createdAt);
    this._immediateEmail = immediateEmail;
    this.Chain = Chain;
    this.Comment = comment;
    this.Thread = thread;
  }

  public static fromJSON(json) {
    return new NotificationSubscription(
      json.id,
      json.category_id,
      json.object_id,
      json.is_active,
      json.created_at,
      json.immediate_email,
      json.chain_id,
      json.Comment || json.offchain_comment_id,
      json.Thread || json.offchain_thread_id
    );
  }
}

export const modelFromServer = (subscription: SubscriptionInstance) => {
  const {
    id,
    category_id,
    object_id,
    is_active,
    created_at,
    immediate_email,
    Chain,
    Comment,
    Thread,
  } = subscription;

  let modeledThread: ThreadT;

  if (Thread) {
    try {
      // The `Thread` var here uses /server/models/thread.ts as its type
      // and we are modeling it to /client/scripts/models/Thread.ts so
      // using any here to avoid lint error.
      modeledThread = new ThreadT(Thread as any);
    } catch (e) {
      console.log('error', e);
    }
  }

  let modeledComment: CommentT<IUniqueId>;

  if (Comment) {
    try {
      modeledComment = new CommentT({ ...Comment } as any);
    } catch (e) {
      console.log('error', e);
    }
  }

  return new NotificationSubscription(
    id,
    category_id,
    object_id,
    is_active,
    created_at,
    immediate_email,
    Chain,
    modeledComment,
    modeledThread
  );
};

export default NotificationSubscription;
