import type { DeliveryMechanismAttributes } from 'server/models/delivery_mechanisms';
import moment from 'moment';

class DeliveryMechanism {
  public readonly id?: number;
  public readonly type: string;
  public readonly identifier: string;
  public readonly userId: number;
  public readonly enabled: boolean;
  public readonly createdAt?: moment.Moment;
  public readonly updatedAt?: moment.Moment;

  constructor(
    id: number,
    type: string,
    identifier: string,
    userId: number,
    enabled: boolean,
    createdAt?: moment.Moment,
    updatedAt?: moment.Moment
  ) {
    this.id = id;
    this.type = type;
    this.identifier = identifier;
    this.userId = userId;
    this.enabled = enabled;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public static fromJSON(json) {
    return new DeliveryMechanism(
      json.id,
      json.type,
      json.identifier,
      json.user_id,
      json.enabled,
      json.created_at,
      json.updated_at
    );
  }

  public static modelFromServer(
    deliveryMechanism: DeliveryMechanismAttributes
  ) {
    const { id, type, identifier, user_id, enabled, created_at, updated_at } =
      deliveryMechanism;
    return new DeliveryMechanism(
      id,
      type,
      identifier,
      user_id,
      enabled,
      moment(created_at),
      moment(updated_at)
    );
  }
}

export default DeliveryMechanism;
