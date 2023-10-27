import { IEventData as CompoundEventData } from '../../../shared/chain/types/compound';
import { IEventData as AaveEventData } from '../../../shared/chain/types/aave';
import { IEventData as CosmosEventData } from '../../../shared/chain/types/cosmos';

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
