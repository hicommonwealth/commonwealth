import type { IChainEntityKind } from 'chain-events/src';
import moment from 'moment';
import ChainEvent from './ChainEvent';

class ChainEntity {
  public readonly chain: string;
  public readonly type: IChainEntityKind;
  public readonly typeId: string;

  // TODO: remove threadTitle?
  public readonly threadTitle?: string;
  public readonly createdAt?: moment.Moment;
  public readonly completed?: boolean;
  public readonly author?: string;

  // This id is the chain-events service chain-entity id -> equivalent to ce_id in ChainEntityMeta in main service
  // This id is only available when the chain-entity is loaded from the server and NOT from the chain
  public readonly id?: number;

  private _updatedAt?: moment.Moment;
  public get updatedAt() {
    return this._updatedAt;
  }

  private _chainEvents?: ChainEvent[];
  public get chainEvents() {
    return this._chainEvents;
  }

  public get stringId(): string {
    return `${this.chain}-${this.type}-${this.typeId}`;
  }

  public eq(e: ChainEntity) {
    return (
      e.chain === this.chain && e.type === this.type && e.typeId === this.typeId
    );
  }

  constructor({
    chain,
    type,
    typeId,
    chainEvents,
    createdAt,
    updatedAt,
    id,
    threadTitle,
    author,
    completed,
  }: {
    chain: string;
    type: IChainEntityKind;
    typeId: string;
    chainEvents: any[];
    createdAt: moment.MomentInput;
    updatedAt: moment.MomentInput;
    threadTitle: string;
    author: string;
    id?: number;
    completed?: boolean;
  }) {
    this.id = id;
    this.chain = chain;
    this.type = type;
    this.typeId = typeId;
    this.threadTitle = decodeURIComponent(threadTitle);
    this.author = author;
    this.createdAt = moment(createdAt);
    this.completed = completed;
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
    const {
      chain,
      type,
      type_id,
      ChainEvents,
      created_at,
      updated_at,
      id,
      Thread,
      title,
      author,
      completed,
    } = json;

    return new ChainEntity({
      chain,
      type,
      typeId: type_id,
      chainEvents: ChainEvents,
      createdAt: created_at,
      updatedAt: updated_at,
      id,
      threadTitle: Thread?.title,
      author,
      completed,
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
