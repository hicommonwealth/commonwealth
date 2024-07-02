import { SupportedNetwork } from '@hicommonwealth/shared';
import { IEventData as CosmosEventData } from '../../../shared/chain/types/cosmos';

export type IChainEventData = CosmosEventData;

export interface CWEvent<IEventData = IChainEventData> {
  blockNumber: number;
  includeAddresses?: string[];
  excludeAddresses?: string[];

  data: IEventData;
  network: SupportedNetwork;
  chain?: string;
  received?: number;
}
