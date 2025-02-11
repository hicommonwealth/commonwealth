// TODO: will be removed when finalizing transition to raw ChainEventCreated schema
//  and consumer side ABI parsing with Viem/abi-types
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
  EVM_ADDRESS.describe('_feeManager'),
  z.string().describe('_signature'),
  EVM_ADDRESS.describe('_namespaceDeployer'),
]);

export const NamespaceDeployedWithReferral = z.tuple([
  z.string().describe('Namespace name'),
  EVM_ADDRESS.describe('Fee manager address of new namespace'),
  EVM_ADDRESS.describe('Referrer address (receiving referral fees)'),
  EVM_ADDRESS.describe('Referral fee manager contract address'),
  z.string().describe('Optional signature for name reservation validation'),
  EVM_ADDRESS.describe('Namespace deployer address (referee)'),
  EVM_ADDRESS.describe('Namespace address'),
]);

export const LaunchpadTokenCreated = z.tuple([
  z.string().describe('tokenAddress'),
  ETHERS_BIG_NUMBER.describe('totalSupply'),
  z.string().describe('name'),
  z.string().describe('symbol'),
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

export const ReferralSet = z.tuple([
  EVM_ADDRESS.describe('namespace address'),
  EVM_ADDRESS.describe('referer address'),
]);

export const ReferralFeeDistributed = z.tuple([
  EVM_ADDRESS.describe('Namespace address'),
  EVM_ADDRESS.describe('Distributed token address'),
  ETHERS_BIG_NUMBER.describe(
    'Total amount of the token that is distributed (includes protocol fee, referral fee, etc)',
  ),
  EVM_ADDRESS.describe('Referrer address (recipient)'),
  ETHERS_BIG_NUMBER.describe(
    'The amount of the token distributed to the referrer',
  ),
]);
