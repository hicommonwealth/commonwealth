import type { CWEvent, IEventLabel } from './interfaces';
import { SupportedNetwork } from './interfaces';
import { Label as CompoundLabel } from './chains/compound';
import { Label as AaveLabel } from './chains/aave';
import { Label as CosmosLabel } from './chains/cosmos';
import { ethers } from 'ethers';

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

/**
 * Converts a string or integer number into a hexadecimal string that adheres to the following guidelines
 * https://ethereum.org/en/developers/docs/apis/json-rpc/#quantities-encoding
 * @param decimal
 */
export function decimalToHex(decimal: number | string) {
  if (decimal == '0') {
    return '0x0';
  } else {
    return ethers.utils.hexStripZeros(
      ethers.BigNumber.from(decimal).toHexString()
    );
  }
}
