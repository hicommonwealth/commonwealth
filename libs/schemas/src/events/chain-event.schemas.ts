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
  z.string().describe('Namespace Address'),
  EVM_ADDRESS.describe('Fee Manager Address (referee address)'),
  z.string().describe('Signature'),
  EVM_ADDRESS.describe('Namespace Deployer Address (referee address)'),
  EVM_ADDRESS.describe('Referrer Address'),
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
  EVM_ADDRESS.describe('Namespace Address'),
  EVM_ADDRESS.describe('Distributed Token Address'),
  ETHERS_BIG_NUMBER.describe(
    'Total amount of the token that is distributed (includes protocol fee, referral fee, etc)',
  ),
  EVM_ADDRESS.describe('Referrer Address'),
  ETHERS_BIG_NUMBER.describe(
    'The amount of the token that is distributed to the referrer',
  ),
  EVM_ADDRESS.describe('Referee Address'),
]);
