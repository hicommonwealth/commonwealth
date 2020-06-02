/**
 * Defines general interfaces for chain event fetching and processing.
 */

import { ISubstrateEventData, SubstrateEventKind, SubstrateEntityKind, EdgewareEventChains } from './edgeware/types';
import { MolochEntityKind, IMolochEventData, MolochEventKind, MolochEventChains } from './moloch/types';

// add other events here as union types
export type IChainEntityKind = SubstrateEntityKind | MolochEntityKind;
export type IChainEventData = ISubstrateEventData | IMolochEventData;
export type IChainEventKind = SubstrateEventKind | MolochEventKind;
export const EventSupportingChains = [...EdgewareEventChains, ...MolochEventChains];

export interface CWEvent<IEventData = IChainEventData> {
  blockNumber: number;
  includeAddresses?: string[];
  excludeAddresses?: string[];

  data: IEventData;
}

// handles individual events by sending them off to storage/notifying
export abstract class IEventHandler<DBEventType = any> {
  // throws on error, returns a db event, or void
  public abstract handle(event: CWEvent, dbEvent?: DBEventType): Promise<DBEventType>;
}

// parses events out of blocks into a standard format and
// passes them through to the handler
export abstract class IEventProcessor<Api, RawEvent> {
  constructor(
    protected _api: Api,
  ) { }

  // throws on error
  public abstract async process(block: RawEvent): Promise<CWEvent[]>;
}

// fetches blocks from chain in real-time via subscription for processing
export abstract class IEventSubscriber<Api, RawEvent> {
  constructor(
    protected _api: Api,
  ) { }

  // throws on error
  public abstract subscribe(cb: (event: RawEvent) => any): void;

  public abstract unsubscribe(): void;
}

export interface IDisconnectedRange {
  startBlock: number;
  endBlock?: number;
}

// synthesizes events from chain storage
export abstract class IStorageFetcher<Api> {
  constructor(
    protected _api: Api,
  ) { }

  public abstract fetch(range?: IDisconnectedRange): Promise<CWEvent[]>;
}


// fetches historical blocks from chain for processing
export abstract class IEventPoller<Api, RawEvent> {
  constructor(
    protected _api: Api,
  ) { }

  // throws on error
  public abstract async poll(range: IDisconnectedRange): Promise<RawEvent[]>;
}

// a set of labels used to display notifications
export interface IEventLabel {
  heading: string;
  label: string;
  linkUrl?: string;
}

// a function that prepares chain data for user display
export type LabelerFilter = (
  blockNumber: number,
  chainId: string,
  data: IChainEventData,
  ...formatters
) => IEventLabel;

export interface IEventTitle {
  title: string;
  description: string;
}

export type TitlerFilter = (
  kind: IChainEventKind,
) => IEventTitle;
