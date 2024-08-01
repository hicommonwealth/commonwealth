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

export const AaveV2ProposalCreated = z.tuple([
  ETHERS_BIG_NUMBER.describe('id'),
  EVM_ADDRESS.describe('creator'),
  EVM_ADDRESS.describe('executor'),
  z.array(EVM_ADDRESS).describe('targets'),
  z.array(z.string()).describe('signatures'),
  z.array(z.string()).describe('calldatas'),
  z.array(z.boolean()).describe('withDelegatecalls'),
  ETHERS_BIG_NUMBER.describe('startBlock'),
  ETHERS_BIG_NUMBER.describe('endBlock'),
  EVM_ADDRESS.describe('strategy'),
  z.string().describe('ipfsHash'),
]);

export const AaveV2ProposalQueued = z.tuple([
  ETHERS_BIG_NUMBER.describe('id'),
  ETHERS_BIG_NUMBER.describe('executionTime'),
  EVM_ADDRESS.describe('initiatorQueueing'),
]);

export const AaveV2ProposalExecuted = z.tuple([
  ETHERS_BIG_NUMBER.describe('id'),
  EVM_ADDRESS.describe('initiatorExecution'),
]);

export const GovBravoProposalCreated = z.tuple([
  ETHERS_BIG_NUMBER.describe('proposalId'),
  EVM_ADDRESS.describe('proposer'),
  z.array(EVM_ADDRESS).describe('targets'),
  z.array(ETHERS_BIG_NUMBER).describe('values'),
  z.array(z.string()).describe('signatures'),
  z.array(z.string()).describe('calldatas'),
  ETHERS_BIG_NUMBER.describe('startBlock'),
  ETHERS_BIG_NUMBER.describe('endBlock'),
  z.string().describe('description'),
]);

export const GovBravoProposalQueued = z.tuple([
  ETHERS_BIG_NUMBER.describe('proposalId'),
  ETHERS_BIG_NUMBER.describe('eta'),
]);

export const GovBravoProposalExecuted = z.tuple([
  ETHERS_BIG_NUMBER.describe('proposalId'),
]);

export const GenericProposalCanceled = z.tuple([
  ETHERS_BIG_NUMBER.describe('proposalId'),
]);
