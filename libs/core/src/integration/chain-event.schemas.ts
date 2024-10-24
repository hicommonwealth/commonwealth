// TODO: temporary - will be deleted as part of chain-events removal
import { ETHERS_BIG_NUMBER, EVM_ADDRESS } from '@hicommonwealth/schemas';
import { z } from 'zod';

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
