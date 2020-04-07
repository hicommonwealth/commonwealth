/**
 * Defines general interfaces for chain event fetching and processing.
 */

// handles individual events by sending them off to storage/notifying
export abstract class IEventHandler<Event> {
  public abstract handle(event: Event): Promise<void>; // TODO: return a status
}

// parses events out of blocks into a standard format and
// passes them through to the handler
export abstract class IBlockProcessor<Block, Event> {
  constructor(
    protected _eventHandler: IEventHandler<Event>
  ) { }

  public abstract process(block: Block): Event[];
}

// fetches blocks from chain in real-time via subscription for processing
export abstract class IBlockSubscriber<Block, Event> {
  constructor(
    protected _blockProcessor: IBlockProcessor<Block, Event>,
    protected _connectionOptions: any,
  ) { }

  public abstract async connect(): Promise<void>;
  public abstract disconnect(): void;
}

// fetches historical blocks from chain for processing
export abstract class IBlockPoller<Block, Event> {
  constructor(
    protected _blockProcessor: IBlockProcessor<Block, Event>,
    protected _connectionOptions: any,
  ) { }

  public abstract async poll(startBlock: number, endBlock?: number): Promise<void>;
}
