import { modelFromServer as modelCommentFromServer } from 'controllers/server/comments';
import moment from 'moment';

import type { SubscriptionInstance } from 'server/models/subscription';
import DeliveryMechanism from './DeliveryMechanism';
import app from '../state';
import type ChainInfo from './ChainInfo';
import type { Comment as CommentT } from './Comment';
import type { IUniqueId } from './interfaces';
import { Thread as ThreadT } from './Thread';

class NotificationSubscription {
  public readonly category: string;
  public readonly objectId: string;
  public readonly createdAt: moment.Moment;
  public readonly Chain: ChainInfo;
  public readonly Comment: CommentT<IUniqueId>;
  public readonly Thread: ThreadT;
  public readonly deliveryInterval?: string;
  public readonly SubscriptionDelivery: DeliveryMechanism[];

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
    deliveryInterval,
    SubscriptionDelivery?: DeliveryMechanism[],
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
    this.deliveryInterval = deliveryInterval;
    this.SubscriptionDelivery = SubscriptionDelivery || [];
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
      json.delivery_interval,
      json.SubscriptionDelivery || [],
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
    delivery_interval,
    SubscriptionDelivery,
    Chain,
    Comment,
    Thread,
  } = subscription;

  let modeledThread: ThreadT;

  if (Thread) {
    try {
      modeledThread = app.threads.modelFromServer(Thread);
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

  const modeledSubscriptionDeliveries: DeliveryMechanism[] =
    SubscriptionDelivery.map((subDelivery) =>
      DeliveryMechanism.modelFromServer(subDelivery.DeliveryMechanism)
    );

  return new NotificationSubscription(
    id,
    category_id,
    object_id,
    is_active,
    created_at,
    immediate_email,
    delivery_interval,
    modeledSubscriptionDeliveries,
    Chain,
    modeledComment,
    modeledThread
  );
};

export default NotificationSubscription;
