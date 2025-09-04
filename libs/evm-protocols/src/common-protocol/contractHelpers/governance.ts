import { Web3 } from 'web3';
import { createPrivateEvmClient } from '../utils';

// Basic Governor ABI with the functions we need
export const VoteGovernanceAbi = [
  // Proposal functions
  {
    inputs: [
      { name: 'targets', type: 'address[]' },
      { name: 'values', type: 'uint256[]' },
      { name: 'calldatas', type: 'bytes[]' },
      { name: 'description', type: 'string' },
    ],
    name: 'propose',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'targets', type: 'address[]' },
      { name: 'values', type: 'uint256[]' },
      { name: 'calldatas', type: 'bytes[]' },
      { name: 'description', type: 'string' },
      { name: 'hook', type: 'address' },
    ],
    name: 'proposeWithHook',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Voting functions
  {
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'support', type: 'uint8' },
    ],
    name: 'castVoteWithTokenId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'uint8' },
    ],
    name: 'castVoteWithAddress',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Execution and cancellation
  {
    inputs: [
      { name: 'targets', type: 'address[]' },
      { name: 'values', type: 'uint256[]' },
      { name: 'calldatas', type: 'bytes[]' },
      { name: 'descriptionHash', type: 'bytes32' },
    ],
    name: 'execute',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'targets', type: 'address[]' },
      { name: 'values', type: 'uint256[]' },
      { name: 'calldatas', type: 'bytes[]' },
      { name: 'descriptionHash', type: 'bytes32' },
    ],
    name: 'cancel',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // View functions
  {
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    name: 'state',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    name: 'proposalVotes',
    outputs: [
      { name: 'againstVotes', type: 'uint256' },
      { name: 'forVotes', type: 'uint256' },
      { name: 'abstainVotes', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    name: '_tokenProposalVotes',
    outputs: [
      { name: 'againstVotes', type: 'uint256' },
      { name: 'forVotes', type: 'uint256' },
      { name: 'abstainVotes', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    name: 'proposals',
    outputs: [
      { name: 'votingPowerSnapshot', type: 'uint256' },
      { name: 'proposalHook', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'tokenId', type: 'uint256' },
    ],
    name: 'hasVotedTokenId',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'account', type: 'address' },
    ],
    name: 'hasVoted',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    name: 'getProposalVotingPowerSnapshot',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    name: 'getProposalHook',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getActiveProposals',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'proposalId', type: 'uint256' },
      { indexed: false, name: 'proposer', type: 'address' },
      { indexed: false, name: 'description', type: 'string' },
    ],
    name: 'ProposalCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'proposalId', type: 'uint256' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'support', type: 'uint8' },
    ],
    name: 'TokenVoteCast',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'proposalId', type: 'uint256' },
      { indexed: true, name: 'voter', type: 'address' },
      { indexed: false, name: 'support', type: 'uint8' },
    ],
    name: 'AddressVoteCast',
    type: 'event',
  },
] as const;

export const proposeGovernance = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  targets: string[],
  values: number[],
  calldatas: string[],
  description: string,
  walletAddress: string,
  maxFeePerGas?: bigint,
) => {
  const contractCall = await contract.methods.propose(
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

  const txReceipt = contractCall.send({
    from: walletAddress,
    type: '0x2',
    gas: gasResult.toString(),
    maxFeePerGas: maxFeePerGas ? maxFeePerGas * 2n : undefined,
    maxPriorityFeePerGas,
  });
  return txReceipt;
};

export const proposeGovernanceWithHook = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
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
    maxFeePerGas: maxFeePerGas ? maxFeePerGas * 2n : undefined,
    maxPriorityFeePerGas,
  });
  return txReceipt;
};

export const castVoteWithTokenId = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
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
    maxFeePerGas: maxFeePerGas ? maxFeePerGas * 2n : undefined,
    maxPriorityFeePerGas,
  });
  return txReceipt;
};

export const castVoteWithAddress = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
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
    maxFeePerGas: maxFeePerGas ? maxFeePerGas * 2n : undefined,
    maxPriorityFeePerGas,
  });
  return txReceipt;
};

export const executeProposal = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
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
    value: ethValue || 0,
  });

  // Calculate maxPriorityFeePerGas as 1/3 of maxFeePerGas if provided
  const maxPriorityFeePerGas = maxFeePerGas ? maxFeePerGas / 3n : undefined;

  const txReceipt = await contractCall.send({
    from: walletAddress,
    value: ethValue || 0,
    type: '0x2',
    gas: gasResult.toString(),
    maxFeePerGas: maxFeePerGas ? maxFeePerGas * 2n : undefined,
    maxPriorityFeePerGas,
  });
  return txReceipt;
};

export const cancelProposal = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
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
    maxFeePerGas: maxFeePerGas ? maxFeePerGas * 2n : undefined,
    maxPriorityFeePerGas,
  });
  return txReceipt;
};

export const getProposalState = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  proposalId: number,
) => {
  const state = await contract.methods.state(proposalId);
  return state.call();
};

export const getProposalVotes = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  proposalId: number,
) => {
  const votes = await contract.methods.proposalVotes(proposalId);
  return votes.call();
};

export const getTokenProposalVotes = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  proposalId: number,
) => {
  const votes = await contract.methods._tokenProposalVotes(proposalId);
  return votes.call();
};

export const getProposalDetails = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  proposalId: number,
) => {
  const details = await contract.methods.proposals(proposalId);
  return details.call();
};

export const hasVotedWithTokenId = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  proposalId: number,
  tokenId: number,
) => {
  const voted = await contract.methods.hasVotedTokenId(proposalId, tokenId);
  return voted.call();
};

export const hasVotedWithAddress = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  proposalId: number,
  address: string,
) => {
  const voted = await contract.methods.hasVoted(proposalId, address);
  return voted.call();
};

export const getProposalVotingPowerSnapshot = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  proposalId: number,
) => {
  const snapshot =
    await contract.methods.getProposalVotingPowerSnapshot(proposalId);
  return snapshot.call();
};

export const getProposalHook = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  proposalId: number,
) => {
  const hook = await contract.methods.getProposalHook(proposalId);
  return hook.call();
};

export const getActiveProposals = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
) => {
  const proposals = await contract.methods.getActiveProposals();
  return proposals.call();
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
