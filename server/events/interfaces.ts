/**
 * Defines general interfaces for chain event fetching and processing.
 */

// handles events by processing them into the correct form for storage/notifying
export abstract class IEventHandler<RawEvent, Event> {
  public abstract handle(event: RawEvent): Event;
}

// parses events out of blocks and passes them through to the handler
export abstract class IBlockProcessor<Block, RawEvent, Event> {
  constructor(
    protected _eventHandler: IEventHandler<RawEvent, Event>
  ) { }

  public abstract process(block: Block): Event[];
}

// fetches blocks from chain in real-time via subscription for processing
export abstract class IBlockSubscriber<Block, RawEvent, Event> {
  constructor(
    protected _blockProcessor: IBlockProcessor<Block, RawEvent, Event>,
    protected _connectionOptions: any,
  ) { }

  public abstract async connect(): Promise<void>;
  public abstract disconnect(): void;
}

// fetches historical blocks from chain for processing
export abstract class IBlockPoller<Block, RawEvent, Event> {
  constructor(
    protected _blockProcessor: IBlockProcessor<Block, RawEvent, Event>,
    protected _connectionOptions: any,
  ) { }

  public abstract async poll(startBlock: number, endBlock?: number): Promise<void>;
}
