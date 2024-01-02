import { SupportedNetwork } from '@hicommonwealth/core';
import { IEventData as AaveEventData } from '../../../shared/chain/types/aave';
import { IEventData as CompoundEventData } from '../../../shared/chain/types/compound';
import { IEventData as CosmosEventData } from '../../../shared/chain/types/cosmos';

export type IChainEventData =
  | CompoundEventData
  | AaveEventData
  | CosmosEventData;

export interface CWEvent<IEventData = IChainEventData> {
  blockNumber: number;
  includeAddresses?: string[];
  excludeAddresses?: string[];

  data: IEventData;
  network: SupportedNetwork;
  chain?: string;
  received?: number;
}
