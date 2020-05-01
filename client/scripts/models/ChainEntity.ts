import moment from 'moment-twitter';

import { IChainEntityKind } from 'events/interfaces';
import ChainEvent from './ChainEvent';

class ChainEntity {
  public readonly id: number;
  public readonly chain: string;
  public readonly type: IChainEntityKind;
  public readonly typeId: string;

  public readonly threadId?: number;
  public readonly createdAt: moment.Moment;

  private _updatedAt: moment.Moment;
  public get updatedAt() { return this._updatedAt; }

  private _chainEvents: ChainEvent[];
  public get chainEvents() { return this._chainEvents; }

  constructor(id, chain, type, typeId, createdAt, updatedAt, chainEvents, threadId?) {
    this.id = id;
    this.chain = chain;
    this.type = type;
    this.typeId = typeId;
    this.threadId = threadId;
    this.createdAt = moment(createdAt);
    this._updatedAt = moment(updatedAt);

    // TODO: move this into a chain event controller to avoid duplication
    this._chainEvents = chainEvents
      .map((c) => ChainEvent.fromJSON(c))
      .sort(({ id: id1 }, { id: id2 }) => id1 - id2); // sort ascending
  }

  public static fromJSON(json) {
    return new ChainEntity(
      json.id,
      json.chain,
      json.type,
      json.type_id,
      json.created_at,
      json.updated_at,
      json.ChainEvents,
      json.thread_id,
    );
  }

  public update(updatedAt, chainEventJson) {
    this._updatedAt = moment(updatedAt);

    // TODO: avoid duplication here as well
    this._chainEvents = chainEventJson.map((c) => ChainEvent.fromJSON(c));
  }
}

export default ChainEntity;
