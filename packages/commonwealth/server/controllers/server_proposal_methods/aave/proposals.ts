import {
  IGovernanceV2Helper,
  IGovernanceV2Helper__factory,
} from '@hicommonwealth/chains';
import { ethers, providers } from 'ethers';
import { IAaveProposalResponse } from '../../../../shared/adapters/chain/aave/types';
import { ProposalState } from '../../../../shared/chain/types/aave';

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

// Extracted return types from the IGovernanceV2Helper interface
export type AaveContractProposalsType = UnwrapPromise<
  ReturnType<IGovernanceV2Helper['getProposals']>
>;
export type AaveContractProposalType = UnwrapPromise<
  ReturnType<IGovernanceV2Helper['getProposal']>
>;

export function formatAaveProposal(
  proposal: AaveContractProposalType,
): IAaveProposalResponse {
  const aaveResponse: IAaveProposalResponse = {
    identifier: proposal.id.toString(),
    id: +proposal.id,
    proposer: proposal.creator,
    executor: proposal.executor,
    targets: proposal.targets,
    // value not available in the object version so access directly
    values: proposal[9].map((v) => v.toString()),
    signatures: proposal.signatures,
    calldatas: proposal.calldatas,
    startBlock: +proposal.startBlock,
    endBlock: +proposal.endBlock,
    strategy: proposal.strategy,
    ipfsHash: proposal.ipfsHash,
    queued: proposal.proposalState === ProposalState.QUEUED,
    executed: proposal.executed,
    cancelled: proposal.canceled,
    completed:
      proposal.proposalState === ProposalState.EXECUTED ||
      proposal.proposalState === ProposalState.CANCELED ||
      proposal.proposalState === ProposalState.FAILED ||
      proposal.proposalState === ProposalState.EXPIRED,
    executionTime: proposal.executionTime ? +proposal.executionTime : undefined,
    minimumQuorum: proposal.minimumQuorum,
    minimumDiff: proposal.minimumDiff,
    votingSupplyAtStart: proposal.totalVotingSupply,
    forVotes: proposal.forVotes,
    againstVotes: proposal.againstVotes,
    executionTimeWithGracePeriod: proposal.executionTimeWithGracePeriod,
  };

  return aaveResponse;
}

export async function getEthereumAaveProposals(
  aaveGovAddress: string,
  provider: providers.Web3Provider,
): Promise<AaveContractProposalsType> {
  // GovernanceV2Helper contract address on Ethereum
  const aaveGovHelperAddress = '0x16ff7583ea21055Bf5F929Ec4b896D997Ff35847';
  const govHelper = IGovernanceV2Helper__factory.connect(
    aaveGovHelperAddress,
    provider,
  );

  // TODO: @Timothee - add Redis caching - skip number of inactive/completed proposals that are cached
  return await govHelper.getProposals(
    0,
    ethers.constants.MaxUint256,
    aaveGovAddress,
  );
}
