/**
 * Defines general interfaces for chain event fetching and processing.
 */

import {
  ISubstrateEventData,
  SubstrateEventKind,
  SubstrateEntityKind,
  EdgewareEventChains,
  SubstrateEventKinds
} from './edgeware/types';
import {
  MolochEntityKind,
  IMolochEventData,
  MolochEventKind,
  MolochEventChains,
  MolochEventKinds
} from './moloch/types';

// add other events here as union types
export type IChainEntityKind = SubstrateEntityKind | MolochEntityKind;
export type IChainEventData = ISubstrateEventData | IMolochEventData;
export type IChainEventKind = SubstrateEventKind | MolochEventKind;
export const ChainEventKinds = [...SubstrateEventKinds, ...MolochEventKinds];
export const EventSupportingChains = [...EdgewareEventChains, ...MolochEventChains];
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
  ) { }

  // throws on error
  public abstract subscribe(cb: (event: RawEvent) => any): void;

  public abstract unsubscribe(): void;
}

export interface ISubscribeOptions<Api> {
  chain: string;
  api: Api;
  handlers: IEventHandler<IChainEventData>[];
  skipCatchup?: boolean;
  discoverReconnectRange?: () => Promise<IDisconnectedRange>;
  performMigration?: boolean;
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
    case SubstrateEntityKind.DemocracyProposal: {
      return 'proposalIndex';
    }
    case SubstrateEntityKind.DemocracyReferendum: {
      return 'referendumIndex';
    }
    case SubstrateEntityKind.DemocracyPreimage: {
      return 'proposalHash';
    }
    case SubstrateEntityKind.TreasuryProposal: {
      return 'proposalIndex';
    }
    case SubstrateEntityKind.CollectiveProposal: {
      return 'proposalHash';
    }
    case SubstrateEntityKind.SignalingProposal: {
      return 'proposalHash';
    }
    case MolochEntityKind.Proposal: {
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
    case SubstrateEventKind.DemocracyProposed: {
      return [ SubstrateEntityKind.DemocracyProposal, EntityEventKind.Create ];
    }
    case SubstrateEventKind.DemocracyTabled: {
      return [ SubstrateEntityKind.DemocracyProposal, EntityEventKind.Complete ];
    }

    case SubstrateEventKind.DemocracyStarted: {
      return [ SubstrateEntityKind.DemocracyReferendum, EntityEventKind.Create ];
    }
    case SubstrateEventKind.DemocracyPassed: {
      return [ SubstrateEntityKind.DemocracyReferendum, EntityEventKind.Update ];
    }
    case SubstrateEventKind.DemocracyNotPassed:
    case SubstrateEventKind.DemocracyCancelled:
    case SubstrateEventKind.DemocracyExecuted: {
      return [ SubstrateEntityKind.DemocracyReferendum, EntityEventKind.Complete ];
    }

    case SubstrateEventKind.PreimageNoted: {
      return [ SubstrateEntityKind.DemocracyPreimage, EntityEventKind.Create ];
    }
    case SubstrateEventKind.PreimageUsed:
    case SubstrateEventKind.PreimageInvalid:
    case SubstrateEventKind.PreimageReaped: {
      return [ SubstrateEntityKind.DemocracyPreimage, EntityEventKind.Complete ];
    }

    case SubstrateEventKind.TreasuryProposed: {
      return [ SubstrateEntityKind.TreasuryProposal, EntityEventKind.Create ];
    }
    case SubstrateEventKind.TreasuryRejected:
    case SubstrateEventKind.TreasuryAwarded: {
      return [ SubstrateEntityKind.TreasuryProposal, EntityEventKind.Complete ];
    }

    case SubstrateEventKind.CollectiveProposed: {
      return [ SubstrateEntityKind.CollectiveProposal, EntityEventKind.Create ];
    }
    case SubstrateEventKind.CollectiveVoted:
    case SubstrateEventKind.CollectiveApproved: {
      return [ SubstrateEntityKind.CollectiveProposal, EntityEventKind.Update ];
    }
    case SubstrateEventKind.CollectiveDisapproved:
    case SubstrateEventKind.CollectiveExecuted: {
      return [ SubstrateEntityKind.CollectiveProposal, EntityEventKind.Complete ];
    }

    // Signaling Events
    case SubstrateEventKind.SignalingNewProposal: {
      return [ SubstrateEntityKind.SignalingProposal, EntityEventKind.Create ];
    }
    case SubstrateEventKind.SignalingCommitStarted:
    case SubstrateEventKind.SignalingVotingStarted: {
      return [ SubstrateEntityKind.SignalingProposal, EntityEventKind.Update ];
    }
    case SubstrateEventKind.SignalingVotingCompleted: {
      return [ SubstrateEntityKind.SignalingProposal, EntityEventKind.Complete ];
    }

    // Moloch Events
    case MolochEventKind.SubmitProposal: {
      return [ MolochEntityKind.Proposal, EntityEventKind.Create ];
    }
    case MolochEventKind.SubmitVote: {
      return [ MolochEntityKind.Proposal, EntityEventKind.Update ];
    }
    case MolochEventKind.ProcessProposal: {
      return [ MolochEntityKind.Proposal, EntityEventKind.Complete ];
    }
    case MolochEventKind.Abort: {
      return [ MolochEntityKind.Proposal, EntityEventKind.Complete ];
    }
    default: {
      return null;
    }
  }
}
