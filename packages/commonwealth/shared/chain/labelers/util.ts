import { SupportedNetwork } from '@hicommonwealth/shared';
import type { CWEvent, IChainEventData } from '../types/types';
import { Label as AaveLabel } from './aave';
import { Label as CompoundLabel } from './compound';
import { Label as CosmosLabel } from './cosmos';

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

export function Label(
  chain: string,
  event: Omit<CWEvent, 'blockNumber'>,
): IEventLabel {
  switch (event.network) {
    case SupportedNetwork.Aave:
      return AaveLabel(chain, event.data);
    case SupportedNetwork.Compound:
      return CompoundLabel(chain, event.data);
    case SupportedNetwork.Cosmos:
      return CosmosLabel(chain, event.data);
    default:
      throw new Error(`Invalid network: ${event.network}`);
  }
}
