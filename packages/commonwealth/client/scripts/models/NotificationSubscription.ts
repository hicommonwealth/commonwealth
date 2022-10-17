import moment from 'moment';

import { SubscriptionInstance } from 'server/models/subscription';
import { modelFromServer as modelThreadFromServer } from 'controllers/server/threads';
import { modelFromServer as modelCommentFromServer } from 'controllers/server/comments';
import { ChainInfo, Comment as CommentT, Thread as ThreadT } from '.';
import { IUniqueId } from './interfaces';

class NotificationSubscription {
  public readonly id: number;
  public readonly category: string;
  public readonly objectId: string;
  public readonly createdAt: moment.Moment;
  public readonly Chain: ChainInfo;
  public readonly ChainEventType: any;
  public readonly Comment: CommentT<IUniqueId>;
  public readonly Thread: ThreadT;

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
    ChainEventType?,
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
    this.ChainEventType = ChainEventType;
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
      json.ChainEventType || json.chain_event_type_id,
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
    ChainEventType,
    Comment,
    Thread,
  } = subscription;

  let modeledThread: ThreadT;

  if (Thread) {
    try {
      modeledThread = modelThreadFromServer(Thread);
    } catch (e) {
      console.log('error', e);
    }
  }

  let modeledComment: CommentT<IUniqueId>;

  if (Comment) {
    try {
      modeledComment = modelCommentFromServer(Comment);
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
    ChainEventType,
    modeledComment,
    modeledThread
  );
};

export default NotificationSubscription;
