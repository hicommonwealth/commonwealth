import type { EthBPOpts } from '../types';
import Web3 from 'web3';

export function validateOpts(
  address: string,
  opts: EthBPOpts & { tokenId?: string }
) {
  const { tokenAddress, contractType, tokenId } = opts;
  if (!tokenAddress) {
    throw new Error('Need Token Address');
  }
  if (contractType === 'erc1155' && !tokenId) {
    throw new Error('Token Id Required For ERC-1155');
  }
  if (!Web3.utils.isAddress(tokenAddress)) {
    throw new Error('Invalid token address');
  }
  if (!Web3.utils.isAddress(address)) {
    throw new Error('Invalid address');
  }
}
