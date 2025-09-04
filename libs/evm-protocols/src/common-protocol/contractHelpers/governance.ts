import { VoteGovernanceAbi } from '@commonxyz/common-governance-abis';
import { Contract, Web3 } from 'web3';
import { createPrivateEvmClient } from '../utils';

export const proposeGovernance = async (
  contract: Contract<typeof VoteGovernanceAbi>,
  targets: string[],
  values: number[],
  calldatas: string[],
  description: string,
  walletAddress: string,
  maxFeePerGas?: bigint,
) => {
  const contractCall = contract.methods.propose(
    targets,
    values,
    calldatas,
    description,
  );

  const gasResult = await contractCall.estimateGas({
    from: walletAddress,
  });

  // Calculate maxPriorityFeePerGas as 1/3 of maxFeePerGas if provided
  const maxPriorityFeePerGas = maxFeePerGas ? maxFeePerGas / 3n : undefined;

  return contractCall.send({
    from: walletAddress,
    type: '0x2',
    gas: gasResult.toString(),
    maxFeePerGas: maxFeePerGas ? String(maxFeePerGas * 2n) : undefined,
    maxPriorityFeePerGas: maxPriorityFeePerGas
      ? String(maxPriorityFeePerGas)
      : undefined,
  });
};

export const proposeGovernanceWithHook = async (
  contract: Contract<typeof VoteGovernanceAbi>,
  targets: string[],
  values: number[],
  calldatas: string[],
  description: string,
  hook: string,
  walletAddress: string,
  maxFeePerGas?: bigint,
) => {
  const contractCall = await contract.methods.proposeWithHook(
    targets,
    values,
    calldatas,
    description,
    hook,
  );

  const gasResult = await contractCall.estimateGas({
    from: walletAddress,
  });

  // Calculate maxPriorityFeePerGas as 1/3 of maxFeePerGas if provided
  const maxPriorityFeePerGas = maxFeePerGas ? maxFeePerGas / 3n : undefined;

  const txReceipt = contractCall.send({
    from: walletAddress,
    type: '0x2',
    gas: gasResult.toString(),
    maxFeePerGas: maxFeePerGas ? String(maxFeePerGas * 2n) : undefined,
    maxPriorityFeePerGas: maxPriorityFeePerGas
      ? String(maxPriorityFeePerGas)
      : undefined,
  });
  return txReceipt;
};

export const castVoteWithTokenId = async (
  contract: Contract<typeof VoteGovernanceAbi>,
  proposalId: number,
  tokenId: number,
  support: number, // 0 = Against, 1 = For, 2 = Abstain
  walletAddress: string,
  maxFeePerGas?: bigint,
) => {
  const contractCall = contract.methods.castVoteWithTokenId(
    proposalId,
    tokenId,
    support,
  );

  const gasResult = await contractCall.estimateGas({
    from: walletAddress,
  });

  // Calculate maxPriorityFeePerGas as 1/3 of maxFeePerGas if provided
  const maxPriorityFeePerGas = maxFeePerGas ? maxFeePerGas / 3n : undefined;

  const txReceipt = await contractCall.send({
    from: walletAddress,
    type: '0x2',
    gas: gasResult ? gasResult.toString() : undefined,
    maxFeePerGas: maxFeePerGas ? String(maxFeePerGas * 2n) : undefined,
    maxPriorityFeePerGas: maxPriorityFeePerGas
      ? String(maxPriorityFeePerGas)
      : undefined,
  });
  return txReceipt;
};

export const castVoteWithAddress = async (
  contract: Contract<typeof VoteGovernanceAbi>,
  proposalId: number,
  support: number, // 0 = Against, 1 = For, 2 = Abstain
  walletAddress: string,
  maxFeePerGas?: bigint,
) => {
  const contractCall = contract.methods.castVoteWithAddress(
    proposalId,
    support,
  );

  const gasResult = await contractCall.estimateGas({
    from: walletAddress,
  });

  // Calculate maxPriorityFeePerGas as 1/3 of maxFeePerGas if provided
  const maxPriorityFeePerGas = maxFeePerGas ? maxFeePerGas / 3n : undefined;

  const txReceipt = await contractCall.send({
    from: walletAddress,
    type: '0x2',
    gas: gasResult ? gasResult.toString() : undefined,
    maxFeePerGas: maxFeePerGas ? String(maxFeePerGas * 2n) : undefined,
    maxPriorityFeePerGas: maxPriorityFeePerGas
      ? String(maxPriorityFeePerGas)
      : undefined,
  });
  return txReceipt;
};

export const executeProposal = async (
  contract: Contract<typeof VoteGovernanceAbi>,
  targets: string[],
  values: number[],
  calldatas: string[],
  descriptionHash: string,
  walletAddress: string,
  maxFeePerGas?: bigint,
  ethValue?: number,
) => {
  const contractCall = contract.methods.execute(
    targets,
    values,
    calldatas,
    descriptionHash,
  );

  const gasResult = await contractCall.estimateGas({
    from: walletAddress,
    value: ethValue ? String(ethValue) : '0',
  });

  // Calculate maxPriorityFeePerGas as 1/3 of maxFeePerGas if provided
  const maxPriorityFeePerGas = maxFeePerGas ? maxFeePerGas / 3n : undefined;

  const txReceipt = await contractCall.send({
    from: walletAddress,
    value: ethValue ? String(ethValue) : '0',
    type: '0x2',
    gas: gasResult.toString(),
    maxFeePerGas: maxFeePerGas ? String(maxFeePerGas * 2n) : undefined,
    maxPriorityFeePerGas: maxPriorityFeePerGas
      ? String(maxPriorityFeePerGas)
      : undefined,
  });
  return txReceipt;
};

export const cancelProposal = async (
  contract: Contract<typeof VoteGovernanceAbi>,
  targets: string[],
  values: number[],
  calldatas: string[],
  descriptionHash: string,
  walletAddress: string,
  maxFeePerGas?: bigint,
) => {
  const contractCall = contract.methods.cancel(
    targets,
    values,
    calldatas,
    descriptionHash,
  );

  const gasResult = await contractCall.estimateGas({
    from: walletAddress,
  });

  // Calculate maxPriorityFeePerGas as 1/3 of maxFeePerGas if provided
  const maxPriorityFeePerGas = maxFeePerGas ? maxFeePerGas / 3n : undefined;

  const txReceipt = await contractCall.send({
    from: walletAddress,
    type: '0x2',
    gas: gasResult.toString(),
    maxFeePerGas: maxFeePerGas ? String(maxFeePerGas * 2n) : undefined,
    maxPriorityFeePerGas: maxPriorityFeePerGas
      ? String(maxPriorityFeePerGas)
      : undefined,
  });
  return txReceipt;
};

export const getProposalState = async (
  contract: Contract<typeof VoteGovernanceAbi>,
  proposalId: number,
) => {
  const state = contract.methods.state(proposalId);
  return await state.call();
};

export const getProposalVotes = async (
  contract: Contract<typeof VoteGovernanceAbi>,
  proposalId: number,
) => {
  const votes = contract.methods.proposalVotes(proposalId);
  return await votes.call();
};

export const getTokenProposalVotes = async (
  contract: Contract<typeof VoteGovernanceAbi>,
  proposalId: number,
) => {
  const votes = contract.methods._tokenProposalVotes(proposalId);
  return await votes.call();
};

export const getProposalDetails = async (
  contract: Contract<typeof VoteGovernanceAbi>,
  proposalId: number,
) => {
  const details = contract.methods.proposals(proposalId);
  return await details.call();
};

export const hasVotedWithTokenId = async (
  contract: Contract<typeof VoteGovernanceAbi>,
  proposalId: number,
  tokenId: number,
) => {
  const voted = contract.methods.hasVotedTokenId(proposalId, tokenId);
  return await voted.call();
};

export const hasVotedWithAddress = async (
  contract: Contract<typeof VoteGovernanceAbi>,
  proposalId: number,
  address: string,
) => {
  const voted = contract.methods.hasVoted(proposalId, address);
  return await voted.call();
};

export const getProposalVotingPowerSnapshot = async (
  contract: Contract<typeof VoteGovernanceAbi>,
  proposalId: number,
) => {
  const snapshot = contract.methods.getProposalVotingPowerSnapshot(proposalId);
  return await snapshot.call();
};

export const getProposalHook = async (
  contract: Contract<typeof VoteGovernanceAbi>,
  proposalId: number,
) => {
  const hook = contract.methods.getProposalHook(proposalId);
  return await hook.call();
};

export const getActiveProposals = async (
  contract: Contract<typeof VoteGovernanceAbi>,
) => {
  const proposals = contract.methods.getActiveProposals();
  return await proposals.call();
};

// Enhanced helper to get comprehensive proposal information
export async function getProposalInfo({
  rpc,
  governanceAddress,
  proposalId,
}: {
  rpc: string;
  governanceAddress: string;
  proposalId: number;
}) {
  const web3 = new Web3(rpc);
  const contract = new web3.eth.Contract(VoteGovernanceAbi, governanceAddress);

  const [state, votes, tokenVotes, details, snapshot, hook] = await Promise.all(
    [
      getProposalState(contract, proposalId),
      getProposalVotes(contract, proposalId),
      getTokenProposalVotes(contract, proposalId),
      getProposalDetails(contract, proposalId),
      getProposalVotingPowerSnapshot(contract, proposalId),
      getProposalHook(contract, proposalId),
    ],
  );

  return {
    proposalId,
    state: Number(state),
    votes: {
      against: votes.againstVotes,
      for: votes.forVotes,
      abstain: votes.abstainVotes,
    },
    tokenVotes: {
      against: tokenVotes.againstVotes,
      for: tokenVotes.forVotes,
      abstain: tokenVotes.abstainVotes,
    },
    details: {
      votingPowerSnapshot: details.votingPowerSnapshot,
      proposalHook: details.proposalHook,
    },
    snapshot: Number(snapshot),
    hook: hook,
  };
}

// Helper to create a proposal with proper encoding
export async function createGovernanceProposal({
  rpc,
  governanceAddress,
  targets,
  values,
  calldatas,
  description,
  hook,
  privateKey,
}: {
  rpc: string;
  governanceAddress: string;
  targets: string[];
  values: number[];
  calldatas: string[];
  description: string;
  hook?: string;
  privateKey: string;
}) {
  const web3 = createPrivateEvmClient({ rpc, privateKey });
  const contract = new web3.eth.Contract(VoteGovernanceAbi, governanceAddress);

  // Estimate gas
  const latestBlock = await web3.eth.getBlock('latest');
  let maxFeePerGas: bigint | undefined;

  if (latestBlock.baseFeePerGas) {
    const maxPriorityFeePerGas = web3.utils.toWei('0.001', 'gwei');
    maxFeePerGas =
      latestBlock.baseFeePerGas * BigInt(2) +
      BigInt(web3.utils.toNumber(maxPriorityFeePerGas));
  }

  if (hook) {
    return await proposeGovernanceWithHook(
      contract,
      targets,
      values,
      calldatas,
      description,
      hook,
      web3.eth.defaultAccount!,
      maxFeePerGas,
    );
  } else {
    return await proposeGovernance(
      contract,
      targets,
      values,
      calldatas,
      description,
      web3.eth.defaultAccount!,
      maxFeePerGas,
    );
  }
}

// Helper to vote on a proposal
export async function voteOnProposal({
  rpc,
  governanceAddress,
  proposalId,
  support,
  tokenId,
  privateKey,
}: {
  rpc: string;
  governanceAddress: string;
  proposalId: number;
  support: number; // 0 = Against, 1 = For, 2 = Abstain
  tokenId?: number;
  privateKey: string;
}) {
  const web3 = createPrivateEvmClient({ rpc, privateKey });
  const contract = new web3.eth.Contract(VoteGovernanceAbi, governanceAddress);

  // Estimate gas
  const latestBlock = await web3.eth.getBlock('latest');
  let maxFeePerGas: bigint | undefined;

  if (latestBlock.baseFeePerGas) {
    const maxPriorityFeePerGas = web3.utils.toWei('0.001', 'gwei');
    maxFeePerGas =
      latestBlock.baseFeePerGas * BigInt(2) +
      BigInt(web3.utils.toNumber(maxPriorityFeePerGas));
  }

  if (tokenId !== undefined) {
    return await castVoteWithTokenId(
      contract,
      proposalId,
      tokenId,
      support,
      web3.eth.defaultAccount!,
      maxFeePerGas,
    );
  } else {
    return await castVoteWithAddress(
      contract,
      proposalId,
      support,
      web3.eth.defaultAccount!,
      maxFeePerGas,
    );
  }
}
