/**
 * Defines general interfaces for chain event fetching and processing.
 */

import { ISubstrateEventType } from './edgeware/types';

export interface CWEvent {
  blockNumber: number;
  affectedAddresses: string[];

  // add other events here as union types
  data: ISubstrateEventType;
}

// handles individual events by sending them off to storage/notifying
export abstract class IEventHandler {
  // throws on error
  public abstract handle(event: CWEvent): Promise<void>;
}

// parses events out of blocks into a standard format and
// passes them through to the handler
export abstract class IBlockProcessor<Api, Block> {
  constructor(
    protected _api: Api,
  ) { }

  // throws on error
  public abstract async process(block: Block): Promise<CWEvent[]>;
}

// fetches blocks from chain in real-time via subscription for processing
export abstract class IBlockSubscriber<Api, Block> {
  constructor(
    protected _api: Api,
  ) { }

  // throws on error
  public abstract subscribe(cb: (block: Block) => any): void;

  public abstract unsubscribe(): void;
}

export interface IDisconnectedRange {
  startBlock: number;
  endBlock?: number;
}

// fetches historical blocks from chain for processing
export abstract class IBlockPoller<Api, Block> {
  constructor(
    protected _api: Api,
  ) { }

  // throws on error
  public abstract async poll(range: IDisconnectedRange): Promise<Block[]>;
}
