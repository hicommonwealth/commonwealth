import moment from 'moment';

import { IChainEntityKind } from 'chain-events/src';
import ChainEvent from './ChainEvent';

class ChainEntity {
  public readonly id?: number;
  public readonly chain: string;
  public readonly type: IChainEntityKind;
  public readonly typeId: string;
  public readonly title?: string;
  public readonly author: string;

  public readonly threadId?: number;
  public readonly threadTitle?: string;
  public readonly createdAt?: moment.Moment;

  private _updatedAt?: moment.Moment;
  public get updatedAt() { return this._updatedAt; }

  private _chainEvents?: ChainEvent[];
  public get chainEvents() { return this._chainEvents; }

  public get stringId(): string {
    return `${this.chain}-${this.type}-${this.typeId}`;
  }

  public eq(e: ChainEntity) {
    return e.chain === this.chain && e.type === this.type && e.typeId === this.typeId;
  }

  constructor({ chain, type, typeId, chainEvents, createdAt, updatedAt, id, threadId, threadTitle, title, author }) {
    this.id = id;
    this.chain = chain;
    this.type = type;
    this.typeId = typeId;
    this.threadId = threadId;
    this.threadTitle = decodeURIComponent(threadTitle);
    this.title = title;
    this.author = author;
    this.createdAt = moment(createdAt);
    this._updatedAt = moment(updatedAt);

    if (chainEvents && chainEvents.length > 0) {
      this._chainEvents = chainEvents
        .map((c) => ChainEvent.fromJSON(c))
        .sort(({ blockNumber: bn1 }, { blockNumber: bn2 }) => bn1 - bn2); // sort ascending
    } else {
      this._chainEvents = [];
    }
  }

  public static fromJSON(json) {
    const { chain, type, type_id, ChainEvents, created_at, updated_at, id, thread_id, Thread, title, author } = json;
    return new ChainEntity({
      chain,
      type,
      typeId: type_id,
      chainEvents: ChainEvents,
      createdAt: created_at,
      updatedAt: updated_at,
      id,
      threadId: thread_id,
      threadTitle: Thread?.title,
      title,
      author,
    });
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
