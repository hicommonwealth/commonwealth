/**
 * Defines general interfaces for chain event fetching and processing.
 */

import type { ApiPromise as SubstrateApi } from '@polkadot/api';

import type { ChainEventInstance } from '../services/database/models/chain_event';

import * as SubstrateTypes from 'chain-events/src/chain-bases/substrate/types';
import * as CompoundTypes from 'chain-events/src/chain-bases/EVM/compound/types';
import * as Erc20Types from 'chain-events/src/chain-bases/EVM/erc20/types';
import * as Erc721Types from 'chain-events/src/chain-bases/EVM/erc721/types';
import * as AaveTypes from 'chain-events/src/chain-bases/EVM/aave/types';
import * as CosmosTypes from 'chain-events/src/chain-bases/cosmos/types';
import type { IErc721Contracts as ERC721Api } from 'chain-events/src/chain-bases/EVM/erc721/types';
import type { IErc20Contracts as ERC20Api } from 'chain-events/src/chain-bases/EVM/erc20/types';
import type { Api as CompoundApi } from 'chain-events/src/chain-bases/EVM/compound/types';
import type { Api as AaveApi } from 'chain-events/src/chain-bases/EVM/aave/types';
import type { Listener } from './Listener';
import { ChainBase, ChainNetwork } from 'common-common/src/types';

// add other events here as union types
export type IChainEntityKind =
  | SubstrateTypes.EntityKind
  | CompoundTypes.EntityKind
  | AaveTypes.EntityKind
  | CosmosTypes.EntityKind;
export type IChainEventData =
  | SubstrateTypes.IEventData
  | CompoundTypes.IEventData
  | AaveTypes.IEventData
  | Erc20Types.IEventData
  | Erc721Types.IEventData
  | CosmosTypes.IEventData;
export type IChainEventKind =
  | SubstrateTypes.EventKind
  | CompoundTypes.EventKind
  | AaveTypes.EventKind
  | Erc20Types.EventKind
  | Erc721Types.EventKind
  | CosmosTypes.EventKind;
export type IAPIs = SubstrateApi | ERC721Api | ERC20Api | CompoundApi | AaveApi;
export type IAnyListener = Listener<
  IAPIs,
  IStorageFetcher<IAPIs>,
  IEventProcessor<IAPIs, any>,
  IEventSubscriber<IAPIs, any>,
  IChainEventKind
>;

export const ChainEventKinds = [
  ...SubstrateTypes.EventKinds,
  ...CompoundTypes.EventKinds,
  ...AaveTypes.EventKinds,
  ...Erc20Types.EventKinds,
  ...Erc721Types.EventKinds,
  ...CosmosTypes.EventKinds,
];

// eslint-disable-next-line no-shadow
export enum SupportedNetwork {
  Substrate = 'substrate',
  Aave = 'aave',
  Compound = 'compound',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  Cosmos = 'cosmos',
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
  data: IEventData;
  network: SupportedNetwork;
  chainName?: string;

  contractAddress?: string;
  received?: number;
  includeAddresses?: string[];
  excludeAddresses?: string[];
}

// handles individual events by sending them off to storage/notifying
export abstract class IEventHandler<
  DBEventType = IChainEventData | ChainEventInstance
> {
  name?: any;

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
  chain: string;
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
  icon?: string;
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

/**
 * This function takes the network and base attribute of our current chains model and returns the relevant chain-event
 * network. The chain-event network is an instance of SupportedNetwork enum. This is NOT the same as the network on
 * the commonwealth chains model. This function is useful for determining which SupportedNetwork listener a
 * Commonwealth 'chain' should use. Throws if the given chainNetwork and chainBase don't  match a chain-event network
 * i.e. SupportedNetwork.
 * @param chainNetwork The network attribute of the Commonwealth chain model
 * @param chainBase The base attribute of the Commonwealth chain model
 */
export function getChainEventNetwork(
  chainNetwork: string,
  chainBase: string
): SupportedNetwork {
  if (chainBase === ChainBase.Substrate) return SupportedNetwork.Substrate;
  else if (chainBase === ChainBase.CosmosSDK) return SupportedNetwork.Cosmos;
  else if (chainNetwork === ChainNetwork.Compound)
    return SupportedNetwork.Compound;
  else if (chainNetwork === ChainNetwork.Aave) return SupportedNetwork.Aave;
  else throw new Error('No matching SupportedNetwork');
}

/**
 * Returns the key of the value that is unique to the entities chain and type i.e. the key whose associated value
 * becomes the type_id of the chain-entity. The combination of chain, type, and type_id must/will always be unique.
 * @param network An instance of a network for which chain-events supports chain-events and chain-entities
 * @param entityKind The entity's creation event kind used to determine type_id for substrate network
 */
export function getUniqueEntityKey(
  network: SupportedNetwork,
  entityKind: IChainEntityKind
): string | null {
  if (network === SupportedNetwork.Compound) {
    return 'id';
  }
  if (network === SupportedNetwork.Aave) {
    return 'id';
  }
  if (network === SupportedNetwork.Cosmos) {
    return 'id';
  }
  switch (entityKind) {
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
    case SubstrateTypes.EntityKind.TipProposal: {
      return 'proposalHash';
    }
    default: {
      return null;
    }
  }
}

export function eventToEntity(
  network: SupportedNetwork,
  event: IChainEventKind
): [IChainEntityKind, EntityEventKind] {
  if (network === SupportedNetwork.Compound) {
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
      default:
        return null;
    }
  }
  if (network === SupportedNetwork.Aave) {
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
      default:
        return null;
    }
  }
  if (network === SupportedNetwork.Cosmos) {
    switch (event) {
      case CosmosTypes.EventKind.SubmitProposal: {
        return [CosmosTypes.EntityKind.Proposal, EntityEventKind.Create];
      }
      case CosmosTypes.EventKind.Deposit:
      case CosmosTypes.EventKind.Vote:
        return [CosmosTypes.EntityKind.Proposal, EntityEventKind.Vote];
      default:
        return null;
    }
  }
  if (network === SupportedNetwork.Substrate) {
    switch (event) {
      // SUBSTRATE
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
        return [
          SubstrateTypes.EntityKind.TipProposal,
          EntityEventKind.Complete,
        ];
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
    }
  }
  return null;
}

export function isEntityCompleted(entityEvents: CWEvent[]): boolean {
  return entityEvents.some(({ network, data: { kind } }) => {
    const entityData = eventToEntity(network, kind);
    return entityData && entityData[1] === EntityEventKind.Complete;
  });
}
