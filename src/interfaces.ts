/**
 * Defines general interfaces for chain event fetching and processing.
 */

import * as SubstrateTypes from './substrate/types';
import * as MolochTypes from './moloch/types';

// add other events here as union types
export type IChainEntityKind = SubstrateTypes.EntityKind | MolochTypes.EntityKind;
export type IChainEventData = SubstrateTypes.IEventData | MolochTypes.IEventData;
export type IChainEventKind = SubstrateTypes.EventKind | MolochTypes.EventKind;
export const ChainEventKinds = [...SubstrateTypes.EventKinds, ...MolochTypes.EventKinds];
export const EventSupportingChains = [...SubstrateTypes.EventChains, ...MolochTypes.EventChains];
export enum EntityEventKind {
  Create = 0,
  Update,
  Complete,
}

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
    protected _verbose = false,
  ) { }

  public get api(): Api { return this._api; }

  // throws on error
  public abstract subscribe(cb: (event: RawEvent) => any): Promise<void>;

  public abstract unsubscribe(): void;
}

export interface ISubscribeOptions<Api> {
  chain: string;
  api: Api;
  handlers: IEventHandler<IChainEventData>[];
  skipCatchup?: boolean;
  discoverReconnectRange?: () => Promise<IDisconnectedRange>;
  performMigration?: boolean;
  verbose?: boolean;
}

export type SubscribeFunc<
  Api, RawEvent, Options extends ISubscribeOptions<Api>
> = (options: Options) => Promise<IEventSubscriber<Api, RawEvent>>;

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

export function entityToFieldName(entity: IChainEntityKind): string | null {
  switch (entity) {
    case SubstrateTypes.EntityKind.DemocracyProposal: {
      return 'proposalIndex';
    }
    case SubstrateTypes.EntityKind.DemocracyReferendum: {
      return 'referendumIndex';
    }
    case SubstrateTypes.EntityKind.DemocracyPreimage: {
      return 'proposalHash';
    }
    case SubstrateTypes.EntityKind.TreasuryProposal: {
      return 'proposalIndex';
    }
    case SubstrateTypes.EntityKind.CollectiveProposal: {
      return 'proposalHash';
    }
    case SubstrateTypes.EntityKind.SignalingProposal: {
      return 'proposalHash';
    }
    case MolochTypes.EntityKind.Proposal: {
      return 'proposalIndex';
    }
    default: {
      // should be exhaustive
      const dummy: never = entity;
      return null;
    }
  }
}

export function eventToEntity(event: IChainEventKind): [ IChainEntityKind, EntityEventKind ] {
  switch (event) {
    case SubstrateTypes.EventKind.DemocracyProposed: {
      return [ SubstrateTypes.EntityKind.DemocracyProposal, EntityEventKind.Create ];
    }
    case SubstrateTypes.EventKind.DemocracyTabled: {
      return [ SubstrateTypes.EntityKind.DemocracyProposal, EntityEventKind.Complete ];
    }

    case SubstrateTypes.EventKind.DemocracyStarted: {
      return [ SubstrateTypes.EntityKind.DemocracyReferendum, EntityEventKind.Create ];
    }
    case SubstrateTypes.EventKind.DemocracyPassed: {
      return [ SubstrateTypes.EntityKind.DemocracyReferendum, EntityEventKind.Update ];
    }
    case SubstrateTypes.EventKind.DemocracyNotPassed:
    case SubstrateTypes.EventKind.DemocracyCancelled:
    case SubstrateTypes.EventKind.DemocracyExecuted: {
      return [ SubstrateTypes.EntityKind.DemocracyReferendum, EntityEventKind.Complete ];
    }

    case SubstrateTypes.EventKind.PreimageNoted: {
      return [ SubstrateTypes.EntityKind.DemocracyPreimage, EntityEventKind.Create ];
    }
    case SubstrateTypes.EventKind.PreimageUsed:
    case SubstrateTypes.EventKind.PreimageInvalid:
    case SubstrateTypes.EventKind.PreimageReaped: {
      return [ SubstrateTypes.EntityKind.DemocracyPreimage, EntityEventKind.Complete ];
    }

    case SubstrateTypes.EventKind.TreasuryProposed: {
      return [ SubstrateTypes.EntityKind.TreasuryProposal, EntityEventKind.Create ];
    }
    case SubstrateTypes.EventKind.TreasuryRejected:
    case SubstrateTypes.EventKind.TreasuryAwarded: {
      return [ SubstrateTypes.EntityKind.TreasuryProposal, EntityEventKind.Complete ];
    }

    case SubstrateTypes.EventKind.CollectiveProposed: {
      return [ SubstrateTypes.EntityKind.CollectiveProposal, EntityEventKind.Create ];
    }
    case SubstrateTypes.EventKind.CollectiveVoted:
    case SubstrateTypes.EventKind.CollectiveApproved: {
      return [ SubstrateTypes.EntityKind.CollectiveProposal, EntityEventKind.Update ];
    }
    case SubstrateTypes.EventKind.CollectiveDisapproved:
    case SubstrateTypes.EventKind.CollectiveExecuted: {
      return [ SubstrateTypes.EntityKind.CollectiveProposal, EntityEventKind.Complete ];
    }

    // Signaling Events
    case SubstrateTypes.EventKind.SignalingNewProposal: {
      return [ SubstrateTypes.EntityKind.SignalingProposal, EntityEventKind.Create ];
    }
    case SubstrateTypes.EventKind.SignalingCommitStarted:
    case SubstrateTypes.EventKind.SignalingVotingStarted: {
      return [ SubstrateTypes.EntityKind.SignalingProposal, EntityEventKind.Update ];
    }
    case SubstrateTypes.EventKind.SignalingVotingCompleted: {
      return [ SubstrateTypes.EntityKind.SignalingProposal, EntityEventKind.Complete ];
    }

    // Moloch Events
    case MolochTypes.EventKind.SubmitProposal: {
      return [ MolochTypes.EntityKind.Proposal, EntityEventKind.Create ];
    }
    case MolochTypes.EventKind.SubmitVote: {
      return [ MolochTypes.EntityKind.Proposal, EntityEventKind.Update ];
    }
    case MolochTypes.EventKind.ProcessProposal: {
      return [ MolochTypes.EntityKind.Proposal, EntityEventKind.Complete ];
    }
    case MolochTypes.EventKind.Abort: {
      return [ MolochTypes.EntityKind.Proposal, EntityEventKind.Complete ];
    }
    default: {
      return null;
    }
  }
}
