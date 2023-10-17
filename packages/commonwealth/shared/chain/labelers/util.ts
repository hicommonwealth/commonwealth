import { CWEvent, IEventLabel, SupportedNetwork } from 'chain-events/src';
import { Label as AaveLabel } from './aave';
import { Label as CompoundLabel } from './compound';
import { Label as CosmosLabel } from './cosmos';

export function Label(
  chain: string,
  event: Omit<CWEvent, 'blockNumber'>
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
