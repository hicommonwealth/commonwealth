import moment from 'moment';

class NotificationSubscription {
  public readonly id: number;
  public readonly category: string;
  public readonly objectId: string;
  public readonly createdAt: moment.Moment;
  public readonly Chain: any;
  public readonly ChainEventType: any;
  public readonly OffchainComment: any;
  public readonly OffchainThread: any;

  private _immediateEmail: boolean;
  public get immediateEmail() { return this._immediateEmail; }
  public enableImmediateEmail() { this._immediateEmail = true; }
  public disableImmediateEmail() { this._immediateEmail = false; }

  private _isActive: boolean;
  public get isActive() { return this._isActive; }
  public enable() { this._isActive = true; }
  public disable() { this._isActive = false; }

  constructor(
    id,
    category,
    objectId,
    isActive,
    createdAt,
    immediateEmail,
    Chain?,
    ChainEventType?,
    OffchainComment?,
    OffchainCommunity?,
    OffchainThread?,
  ) {
    this.id = id;
    this.category = category;
    this.objectId = objectId;
    this._isActive = isActive;
    this.createdAt = moment(createdAt);
    this._immediateEmail = immediateEmail;
    this.Chain = Chain;
    this.ChainEventType = ChainEventType;
    this.OffchainComment = OffchainComment;
    this.OffchainThread = OffchainThread;
  }

  public static fromJSON(json) {
    return new NotificationSubscription(
      json.id,
      json.category_id,
      json.object_id,
      json.is_active,
      json.created_at,
      json.immediate_email,
      json.Chain || json.chain_id,
      json.ChainEventType || json.chain_event_type_id,
      json.OffchainComment || json.offchain_comment_id,
      json.OffchainCommunity || json.offchain_community_id,
      json.OffchainThread || json.offchain_thread_id,
    );
  }
}

export default NotificationSubscription;
