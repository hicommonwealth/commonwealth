// TODO: temporary - will be deleted as part of chain-events removal
import { z } from 'zod';
import { ETHERS_BIG_NUMBER, EVM_ADDRESS, zBoolean } from '../utils';

export const CommunityStakeTrade = z.tuple([
  EVM_ADDRESS.describe('trader'),
  EVM_ADDRESS.describe('namespaceAddress'),
  z.boolean().describe('isBuy'),
  ETHERS_BIG_NUMBER.describe('communityTokenAmount'),
  ETHERS_BIG_NUMBER.describe('ethAmount'),
  ETHERS_BIG_NUMBER.describe('protocolEthAmount'),
  ETHERS_BIG_NUMBER.describe('nameSpaceEthAmount'),
  ETHERS_BIG_NUMBER.describe('supply'),
  EVM_ADDRESS.describe('exchangeToken'),
]);

export const NamespaceDeployed = z.tuple([
  z.string().describe('name'),
  EVM_ADDRESS.describe('_feeManger'),
  z.string().describe('_signature'),
  EVM_ADDRESS.describe('_namespaceDeployer'),
]);

export const LaunchpadTokenCreated = z.tuple([
  z.string().describe('tokenAddress'),
]);

export const LaunchpadTrade = z.tuple([
  EVM_ADDRESS.describe('trader'),
  EVM_ADDRESS.describe('tokenAddress'), // The contract definition is incorrect (confirmed with Ian)
  zBoolean.describe('isBuy'),
  ETHERS_BIG_NUMBER.describe('communityTokenAmount'),
  ETHERS_BIG_NUMBER.describe('ethAmount'),
  ETHERS_BIG_NUMBER.describe('protocolEthAmount'),
  ETHERS_BIG_NUMBER.describe('supply'),
]);
