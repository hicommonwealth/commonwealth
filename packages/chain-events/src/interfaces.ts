/**
 * Defines general interfaces for chain event fetching and processing.
 */

import { IEventData as CompoundEventData } from '../../commonwealth/shared/chain/types/compound';
import { IEventData as AaveEventData } from '../../commonwealth/shared/chain/types/aave';
import { IEventData as CosmosEventData } from '../../commonwealth/shared/chain/types/cosmos';

export type IChainEventData =
  | CompoundEventData
  | AaveEventData
  | CosmosEventData;

// eslint-disable-next-line no-shadow
export enum SupportedNetwork {
  Substrate = 'substrate',
  Aave = 'aave',
  Compound = 'compound',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  Cosmos = 'cosmos',
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
