/**
 * Defines general interfaces for chain event fetching and processing.
 */

import * as CompoundTypes from './chains/compound/types';
import * as AaveTypes from './chains/aave/types';
import * as CosmosTypes from './chains/cosmos/types';

// add other events here as union types
export type IChainEntityKind =
  | CompoundTypes.EntityKind
  | AaveTypes.EntityKind
  | CosmosTypes.EntityKind;
export type IChainEventData =
  | CompoundTypes.IEventData
  | AaveTypes.IEventData
  | CosmosTypes.IEventData;
export type IChainEventKind =
  | CompoundTypes.EventKind
  | AaveTypes.EventKind
  | CosmosTypes.EventKind;

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
  includeAddresses?: string[];
  excludeAddresses?: string[];

  data: IEventData;
  network: SupportedNetwork;
  chain?: string;
  received?: number;
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
  chainId: string,
  data: IChainEventData,
  ...formatters
) => IEventLabel;

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
  return null;
}
