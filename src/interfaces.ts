/**
 * Defines general interfaces for chain event fetching and processing.
 */

import * as SubstrateTypes from './chains/substrate/types';
import * as MolochTypes from './chains/moloch/types';
import * as CompoundTypes from './chains/compound/types';
import * as Erc20Types from './chains/erc20/types';
import * as AaveTypes from './chains/aave/types';

// add other events here as union types
export type IChainEntityKind =
  | SubstrateTypes.EntityKind
  | MolochTypes.EntityKind
  | CompoundTypes.EntityKind
  | AaveTypes.EntityKind;
export type IChainEventData =
  | SubstrateTypes.IEventData
  | MolochTypes.IEventData
  | CompoundTypes.IEventData
  | AaveTypes.IEventData
  | Erc20Types.IEventData;
export type IChainEventKind =
  | SubstrateTypes.EventKind
  | MolochTypes.EventKind
  | CompoundTypes.EventKind
  | AaveTypes.EventKind
  | Erc20Types.EventKind;
export const ChainEventKinds = [
  ...SubstrateTypes.EventKinds,
  ...MolochTypes.EventKinds,
  ...CompoundTypes.EventKinds,
  ...AaveTypes.EventKinds,
  ...Erc20Types.EventKinds,
];
export const EventSupportingChains = [
  ...SubstrateTypes.EventChains,
  ...MolochTypes.EventChains,
  ...CompoundTypes.EventChains,
  ...AaveTypes.EventChains,
  ...Erc20Types.EventChains,
] as const;
export type EventSupportingChainT = typeof EventSupportingChains[number];

export function chainSupportedBy<T extends readonly string[]>(
  c: string,
  eventChains: T
): c is T[number] {
  return eventChains.some((s) => s === c);
}

export function isSupportedChain(
  chain: string
): chain is EventSupportingChainT {
  return chainSupportedBy(chain, EventSupportingChains);
}

// eslint-disable-next-line no-shadow
export enum EntityEventKind {
  Create = 0,
  Update,
  Vote,
  Complete,
}

export interface CWEvent<IEventData = IChainEventData> {
  blockNumber: number;
  includeAddresses?: string[];
  excludeAddresses?: string[];

  data: IEventData;
  chain?: EventSupportingChainT;
  received?: number;
}

// handles individual events by sending them off to storage/notifying
export abstract class IEventHandler<DBEventType = IChainEventData> {
  // throws on error, returns a db event, or void
  public abstract handle(
    event: CWEvent,
    dbEvent?: DBEventType
  ): Promise<DBEventType>;
}

// parses events out of blocks into a standard format and
// passes them through to the handler
export abstract class IEventProcessor<Api, RawEvent> {
  constructor(protected _api: Api) {}

  // throws on error
  public abstract process(block: RawEvent): Promise<CWEvent[]>;
}

// fetches blocks from chain in real-time via subscription for processing
export abstract class IEventSubscriber<Api, RawEvent> {
  constructor(protected _api: Api, protected _verbose = false) {}

  public get api(): Api {
    return this._api;
  }

  // throws on error
  public abstract subscribe(cb: (event: RawEvent) => void): Promise<void>;

  public abstract unsubscribe(): void;
}

export interface IDisconnectedRange {
  startBlock?: number;
  endBlock?: number;
  maxResults?: number;
}

export interface ISubscribeOptions<Api> {
  chain: EventSupportingChainT;
  api: Api;
  handlers: IEventHandler<IChainEventData>[];
  skipCatchup?: boolean;
  archival?: boolean;
  startBlock?: number;
  discoverReconnectRange?: () => Promise<IDisconnectedRange>;
  verbose?: boolean;
}

export type SubscribeFunc<
  Api,
  RawEvent,
  Options extends ISubscribeOptions<Api>
> = (options: Options) => Promise<IEventSubscriber<Api, RawEvent>>;

// synthesizes events from chain storage
export abstract class IStorageFetcher<Api> {
  constructor(protected _api: Api) {}

  public abstract fetch(
    range?: IDisconnectedRange,
    fetchAllCompleted?: boolean
  ): Promise<CWEvent[]>;

  public abstract fetchOne(
    id: string,
    kind?: IChainEntityKind
  ): Promise<CWEvent[]>;
}

// fetches historical blocks from chain for processing
export abstract class IEventPoller<Api, RawEvent> {
  constructor(protected _api: Api) {}

  // throws on error
  public abstract poll(
    range: IDisconnectedRange,
    maxRange?: number
  ): Promise<RawEvent[]>;
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

export type TitlerFilter = (kind: IChainEventKind) => IEventTitle;

export function entityToFieldName(
  chain: EventSupportingChainT,
  entity: IChainEntityKind
): string | null {
  if (MolochTypes.EventChains.find((c) => c === chain)) {
    return 'proposalIndex';
  }
  if (CompoundTypes.EventChains.find((c) => c === chain)) {
    return 'id';
  }
  if (AaveTypes.EventChains.find((c) => c === chain)) {
    return 'id';
  }
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
    case SubstrateTypes.EntityKind.TreasuryBounty: {
      return 'bountyIndex';
    }
    case SubstrateTypes.EntityKind.CollectiveProposal: {
      return 'proposalHash';
    }
    case SubstrateTypes.EntityKind.SignalingProposal: {
      return 'proposalHash';
    }
    case SubstrateTypes.EntityKind.TipProposal: {
      return 'proposalHash';
    }
    case MolochTypes.EntityKind.Proposal: {
      return 'proposalIndex';
    }
    case CompoundTypes.EntityKind.Proposal: {
      return 'id';
    }
    default: {
      return null;
    }
  }
}

export function eventToEntity(
  chain: EventSupportingChainT,
  event: IChainEventKind
): [IChainEntityKind, EntityEventKind] {
  if (MolochTypes.EventChains.find((c) => c === chain)) {
    switch (event) {
      case MolochTypes.EventKind.SubmitProposal: {
        return [MolochTypes.EntityKind.Proposal, EntityEventKind.Create];
      }
      case MolochTypes.EventKind.SubmitVote: {
        return [MolochTypes.EntityKind.Proposal, EntityEventKind.Vote];
      }
      case MolochTypes.EventKind.ProcessProposal: {
        return [MolochTypes.EntityKind.Proposal, EntityEventKind.Complete];
      }
      case MolochTypes.EventKind.Abort: {
        return [MolochTypes.EntityKind.Proposal, EntityEventKind.Complete];
      }
      default: {
        return null;
      }
    }
  }
  if (CompoundTypes.EventChains.find((c) => c === chain)) {
    switch (event) {
      case CompoundTypes.EventKind.ProposalCanceled: {
        return [CompoundTypes.EntityKind.Proposal, EntityEventKind.Complete];
      }
      case CompoundTypes.EventKind.ProposalCreated: {
        return [CompoundTypes.EntityKind.Proposal, EntityEventKind.Create];
      }
      case CompoundTypes.EventKind.ProposalExecuted: {
        return [CompoundTypes.EntityKind.Proposal, EntityEventKind.Complete];
      }
      case CompoundTypes.EventKind.ProposalQueued: {
        return [CompoundTypes.EntityKind.Proposal, EntityEventKind.Update];
      }
      case CompoundTypes.EventKind.VoteCast: {
        return [CompoundTypes.EntityKind.Proposal, EntityEventKind.Vote];
      }
      default: {
        return null;
      }
    }
  }
  if (AaveTypes.EventChains.find((c) => c === chain)) {
    switch (event) {
      case AaveTypes.EventKind.ProposalCreated: {
        return [AaveTypes.EntityKind.Proposal, EntityEventKind.Create];
      }
      case AaveTypes.EventKind.VoteEmitted: {
        return [AaveTypes.EntityKind.Proposal, EntityEventKind.Vote];
      }
      case AaveTypes.EventKind.ProposalQueued: {
        return [AaveTypes.EntityKind.Proposal, EntityEventKind.Update];
      }
      case AaveTypes.EventKind.ProposalExecuted:
      case AaveTypes.EventKind.ProposalCanceled: {
        return [AaveTypes.EntityKind.Proposal, EntityEventKind.Complete];
      }
      default: {
        return null;
      }
    }
  }
  switch (event) {
    // Democracy Events
    case SubstrateTypes.EventKind.DemocracyProposed: {
      return [
        SubstrateTypes.EntityKind.DemocracyProposal,
        EntityEventKind.Create,
      ];
    }
    case SubstrateTypes.EventKind.DemocracyTabled: {
      return [
        SubstrateTypes.EntityKind.DemocracyProposal,
        EntityEventKind.Complete,
      ];
    }

    case SubstrateTypes.EventKind.DemocracyStarted: {
      return [
        SubstrateTypes.EntityKind.DemocracyReferendum,
        EntityEventKind.Create,
      ];
    }
    case SubstrateTypes.EventKind.DemocracyVoted: {
      return [
        SubstrateTypes.EntityKind.DemocracyReferendum,
        EntityEventKind.Vote,
      ];
    }
    case SubstrateTypes.EventKind.DemocracyPassed: {
      return [
        SubstrateTypes.EntityKind.DemocracyReferendum,
        EntityEventKind.Update,
      ];
    }
    case SubstrateTypes.EventKind.DemocracyNotPassed:
    case SubstrateTypes.EventKind.DemocracyCancelled:
    case SubstrateTypes.EventKind.DemocracyExecuted: {
      return [
        SubstrateTypes.EntityKind.DemocracyReferendum,
        EntityEventKind.Complete,
      ];
    }

    // Preimage Events
    case SubstrateTypes.EventKind.PreimageNoted: {
      return [
        SubstrateTypes.EntityKind.DemocracyPreimage,
        EntityEventKind.Create,
      ];
    }
    case SubstrateTypes.EventKind.PreimageUsed:
    case SubstrateTypes.EventKind.PreimageInvalid:
    case SubstrateTypes.EventKind.PreimageReaped: {
      return [
        SubstrateTypes.EntityKind.DemocracyPreimage,
        EntityEventKind.Complete,
      ];
    }

    // Tip Events
    case SubstrateTypes.EventKind.NewTip: {
      return [SubstrateTypes.EntityKind.TipProposal, EntityEventKind.Create];
    }
    case SubstrateTypes.EventKind.TipVoted:
    case SubstrateTypes.EventKind.TipClosing: {
      return [SubstrateTypes.EntityKind.TipProposal, EntityEventKind.Update];
    }
    case SubstrateTypes.EventKind.TipClosed:
    case SubstrateTypes.EventKind.TipRetracted:
    case SubstrateTypes.EventKind.TipSlashed: {
      return [SubstrateTypes.EntityKind.TipProposal, EntityEventKind.Complete];
    }

    // Treasury Events
    case SubstrateTypes.EventKind.TreasuryProposed: {
      return [
        SubstrateTypes.EntityKind.TreasuryProposal,
        EntityEventKind.Create,
      ];
    }
    case SubstrateTypes.EventKind.TreasuryRejected:
    case SubstrateTypes.EventKind.TreasuryAwarded: {
      return [
        SubstrateTypes.EntityKind.TreasuryProposal,
        EntityEventKind.Complete,
      ];
    }

    // Bounty Events
    case SubstrateTypes.EventKind.TreasuryBountyProposed: {
      return [SubstrateTypes.EntityKind.TreasuryBounty, EntityEventKind.Create];
    }
    case SubstrateTypes.EventKind.TreasuryBountyAwarded: {
      return [SubstrateTypes.EntityKind.TreasuryBounty, EntityEventKind.Update];
    }
    case SubstrateTypes.EventKind.TreasuryBountyBecameActive: {
      return [SubstrateTypes.EntityKind.TreasuryBounty, EntityEventKind.Update];
    }
    case SubstrateTypes.EventKind.TreasuryBountyCanceled: {
      return [
        SubstrateTypes.EntityKind.TreasuryBounty,
        EntityEventKind.Complete,
      ];
    }
    case SubstrateTypes.EventKind.TreasuryBountyClaimed: {
      return [
        SubstrateTypes.EntityKind.TreasuryBounty,
        EntityEventKind.Complete,
      ];
    }
    case SubstrateTypes.EventKind.TreasuryBountyExtended: {
      return [SubstrateTypes.EntityKind.TreasuryBounty, EntityEventKind.Update];
    }
    case SubstrateTypes.EventKind.TreasuryBountyRejected: {
      return [
        SubstrateTypes.EntityKind.TreasuryBounty,
        EntityEventKind.Complete,
      ];
    }

    // Collective Events
    case SubstrateTypes.EventKind.CollectiveProposed: {
      return [
        SubstrateTypes.EntityKind.CollectiveProposal,
        EntityEventKind.Create,
      ];
    }
    case SubstrateTypes.EventKind.CollectiveVoted: {
      return [
        SubstrateTypes.EntityKind.CollectiveProposal,
        EntityEventKind.Vote,
      ];
    }
    case SubstrateTypes.EventKind.CollectiveApproved: {
      return [
        SubstrateTypes.EntityKind.CollectiveProposal,
        EntityEventKind.Update,
      ];
    }
    case SubstrateTypes.EventKind.CollectiveDisapproved:
    case SubstrateTypes.EventKind.CollectiveExecuted: {
      return [
        SubstrateTypes.EntityKind.CollectiveProposal,
        EntityEventKind.Complete,
      ];
    }

    // Signaling Events
    case SubstrateTypes.EventKind.SignalingNewProposal: {
      return [
        SubstrateTypes.EntityKind.SignalingProposal,
        EntityEventKind.Create,
      ];
    }
    case SubstrateTypes.EventKind.SignalingCommitStarted:
    case SubstrateTypes.EventKind.SignalingVotingStarted: {
      return [
        SubstrateTypes.EntityKind.SignalingProposal,
        EntityEventKind.Update,
      ];
    }
    case SubstrateTypes.EventKind.SignalingVotingCompleted: {
      return [
        SubstrateTypes.EntityKind.SignalingProposal,
        EntityEventKind.Complete,
      ];
    }
    default: {
      return null;
    }
  }
}

export function isEntityCompleted(
  chain: EventSupportingChainT,
  entityEvents: CWEvent<any>[]
): boolean {
  return entityEvents.some(({ data: { kind } }) => {
    const entityData = eventToEntity(chain, kind);
    return entityData && entityData[1] === EntityEventKind.Complete;
  });
}
