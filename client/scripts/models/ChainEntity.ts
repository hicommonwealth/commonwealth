import moment from 'moment-twitter';

import { IChainEntityKind } from 'events/interfaces';
import ChainEvent from './ChainEvent';

class ChainEntity {
  public readonly id?: number;
  public readonly chain: string;
  public readonly type: IChainEntityKind;
  public readonly typeId: string;

  public readonly threadId?: number;
  public readonly createdAt?: moment.Moment;

  private _updatedAt?: moment.Moment;
  public get updatedAt() { return this._updatedAt; }

  private _chainEvents: ChainEvent[];
  public get chainEvents() { return this._chainEvents; }

  public get stringId(): string {
    return `${this.chain}-${this.type}-${this.typeId}`;
  }

  public eq(e: ChainEntity) {
    return e.chain === this.chain && e.type === this.type && e.typeId === this.typeId;
  }

  constructor(chain, type, typeId, chainEvents, createdAt?, updatedAt?, id?, threadId?) {
    this.id = id;
    this.chain = chain;
    this.type = type;
    this.typeId = typeId;
    this.threadId = threadId;
    this.createdAt = moment(createdAt);
    this._updatedAt = moment(updatedAt);

    // TODO: move this into a chain event controller to avoid duplication
    this._chainEvents = (chainEvents || [])
      .map((c) => ChainEvent.fromJSON(c))
      .sort(({ blockNumber: bn1 }, { blockNumber: bn2 }) => bn1 - bn2); // sort ascending
  }

  public static fromJSON(json) {
    return new ChainEntity(
      json.chain,
      json.type,
      json.type_id,
      json.created_at,
      json.updated_at,
      json.ChainEvents,
      json.id,
      json.thread_id,
    );
  }

  public addEvent(chainEvent: ChainEvent, updatedAt?: moment.Moment) {
    if (!this._chainEvents.find((e) => e.eq(chainEvent))) {
      this._chainEvents.push(chainEvent);
      if (updatedAt) {
        this._updatedAt = updatedAt;
      }
    }
  }
}

export default ChainEntity;
