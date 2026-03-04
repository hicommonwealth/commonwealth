import { VoteGovernanceAbi } from '@commonxyz/common-governance-abis';
import {
  cancelProposal,
  castVoteWithAddress,
  castVoteWithTokenId,
  executeProposal,
  getActiveProposals,
  getProposalDetails,
  getProposalHook,
  getProposalState,
  getProposalVotes,
  getProposalVotingPowerSnapshot,
  getTokenProposalVotes,
  hasVotedWithAddress,
  hasVotedWithTokenId,
  proposeGovernance,
  proposeGovernanceWithHook,
} from '@hicommonwealth/evm-protocols';
import ContractBase from './ContractBase';

// Proposal states enum (from OpenZeppelin Governor)
export enum ProposalState {
  Pending = 0,
  Active = 1,
  Canceled = 2,
  Defeated = 3,
  Succeeded = 4,
  Queued = 5,
  Expired = 6,
  Executed = 7,
}

// Vote support enum
export enum VoteSupport {
  Against = 0,
  For = 1,
  Abstain = 2,
}

export interface ProposalVotes {
  against: string;
  for: string;
  abstain: string;
}

export interface ProposalDetails {
  votingPowerSnapshot: string;
  proposalHook: string;
}

export interface ProposalInfo {
  proposalId: number;
  state: ProposalState;
  votes: ProposalVotes;
  tokenVotes: ProposalVotes;
  details: ProposalDetails;
  snapshot: number;
  hook: string;
}

class VoteGovernance extends ContractBase {
  veTokenAddress: string;

  constructor(governanceAddress: string, veTokenAddress: string, rpc: string) {
    super(governanceAddress, VoteGovernanceAbi, rpc);
    this.veTokenAddress = veTokenAddress;
  }

  async initialize(
    withWallet?: boolean,
    chainId?: string | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providerInstance?: any,
  ): Promise<void> {
    await super.initialize(withWallet, chainId, providerInstance);
  }

  /**
   * Create a new governance proposal
   */
  async createProposal(
    targets: string[],
    values: number[],
    calldatas: string[],
    description: string,
    walletAddress: string,
    chainId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providerInstance?: any,
  ) {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true, chainId, providerInstance);
    }

    const maxFeePerGas = await this.estimateGas();
    const txReceipt = await proposeGovernance(
      this.contract,
      targets,
      values,
      calldatas,
      description,
      walletAddress,
      maxFeePerGas!,
    );
    return txReceipt;
  }

  /**
   * Create a new governance proposal with a hook
   */
  async createProposalWithHook(
    targets: string[],
    values: number[],
    calldatas: string[],
    description: string,
    hook: string,
    walletAddress: string,
    chainId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providerInstance?: any,
  ) {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true, chainId, providerInstance);
    }

    const maxFeePerGas = await this.estimateGas();
    const txReceipt = await proposeGovernanceWithHook(
      this.contract,
      targets,
      values,
      calldatas,
      description,
      hook,
      walletAddress,
      maxFeePerGas!,
    );
    return txReceipt;
  }

  /**
   * Vote on a proposal using a specific token ID
   */
  async voteWithTokenId(
    proposalId: number,
    tokenId: number,
    support: VoteSupport,
    walletAddress: string,
    chainId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providerInstance?: any,
  ) {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true, chainId, providerInstance);
    }

    const maxFeePerGas = await this.estimateGas();
    const txReceipt = await castVoteWithTokenId(
      this.contract,
      proposalId,
      tokenId,
      support,
      walletAddress,
      maxFeePerGas!,
    );
    return txReceipt;
  }

  /**
   * Vote on a proposal using an address (standard governor voting)
   */
  async voteWithAddress(
    proposalId: number,
    support: VoteSupport,
    walletAddress: string,
    chainId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providerInstance?: any,
  ) {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true, chainId, providerInstance);
    }

    const maxFeePerGas = await this.estimateGas();
    const txReceipt = await castVoteWithAddress(
      this.contract,
      proposalId,
      support,
      walletAddress,
      maxFeePerGas!,
    );
    return txReceipt;
  }

  /**
   * Execute a passed proposal
   */
  async executeProposal(
    targets: string[],
    values: number[],
    calldatas: string[],
    descriptionHash: string,
    walletAddress: string,
    chainId: string,
    ethValue?: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providerInstance?: any,
  ) {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true, chainId, providerInstance);
    }

    const maxFeePerGas = await this.estimateGas();
    const txReceipt = await executeProposal(
      this.contract,
      targets,
      values,
      calldatas,
      descriptionHash,
      walletAddress,
      maxFeePerGas!,
      ethValue,
    );
    return txReceipt;
  }

  /**
   * Cancel a proposal
   */
  async cancelProposal(
    targets: string[],
    values: number[],
    calldatas: string[],
    descriptionHash: string,
    walletAddress: string,
    chainId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providerInstance?: any,
  ) {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true, chainId, providerInstance);
    }

    const maxFeePerGas = await this.estimateGas();
    const txReceipt = await cancelProposal(
      this.contract,
      targets,
      values,
      calldatas,
      descriptionHash,
      walletAddress,
      maxFeePerGas!,
    );
    return txReceipt;
  }

  /**
   * Get the current state of a proposal
   */
  async getProposalState(
    proposalId: number,
    chainId?: string,
  ): Promise<ProposalState> {
    if (!this.initialized) {
      await this.initialize(false, chainId);
    }

    const state = await getProposalState(this.contract, proposalId);
    return Number(state) as ProposalState;
  }

  /**
   * Get vote counts for a proposal (address-based votes)
   */
  async getProposalVotes(
    proposalId: number,
    chainId?: string,
  ): Promise<ProposalVotes> {
    if (!this.initialized) {
      await this.initialize(false, chainId);
    }

    const votes = await getProposalVotes(this.contract, proposalId);
    return {
      against:
        typeof votes.againstVotes === 'string'
          ? votes.againstVotes
          : String(votes.againstVotes),
      for:
        typeof votes.forVotes === 'string'
          ? votes.forVotes
          : String(votes.forVotes),
      abstain:
        typeof votes.abstainVotes === 'string'
          ? votes.abstainVotes
          : String(votes.abstainVotes),
    };
  }

  /**
   * Get vote counts for a proposal (token-based votes)
   */
  async getTokenProposalVotes(
    proposalId: number,
    chainId?: string,
  ): Promise<ProposalVotes> {
    if (!this.initialized) {
      await this.initialize(false, chainId);
    }

    const votes = await getTokenProposalVotes(this.contract, proposalId);
    return {
      against:
        typeof votes.againstVotes === 'string'
          ? votes.againstVotes
          : String(votes.againstVotes),
      for:
        typeof votes.forVotes === 'string'
          ? votes.forVotes
          : String(votes.forVotes),
      abstain:
        typeof votes.abstainVotes === 'string'
          ? votes.abstainVotes
          : String(votes.abstainVotes),
    };
  }

  /**
   * Get proposal details
   */
  async getProposalDetails(
    proposalId: number,
    chainId?: string,
  ): Promise<ProposalDetails> {
    if (!this.initialized) {
      await this.initialize(false, chainId);
    }

    const details = await getProposalDetails(this.contract, proposalId);
    return {
      votingPowerSnapshot:
        typeof details.votingPowerSnapshot === 'string'
          ? details.votingPowerSnapshot
          : String(details.votingPowerSnapshot),
      proposalHook: details.proposalHook,
    };
  }

  /**
   * Check if a specific token has voted on a proposal
   */
  async hasTokenVoted(
    proposalId: number,
    tokenId: number,
    chainId?: string,
  ): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize(false, chainId);
    }

    const hasVoted = await hasVotedWithTokenId(
      this.contract,
      proposalId,
      tokenId,
    );
    return Boolean(hasVoted);
  }

  /**
   * Check if an address has voted on a proposal
   */
  async hasAddressVoted(
    proposalId: number,
    address: string,
    chainId?: string,
  ): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize(false, chainId);
    }

    const hasVoted = await hasVotedWithAddress(
      this.contract,
      proposalId,
      address,
    );
    return Boolean(hasVoted);
  }

  /**
   * Get the voting power snapshot for a proposal
   */
  async getVotingPowerSnapshot(
    proposalId: number,
    chainId?: string,
  ): Promise<number> {
    if (!this.initialized) {
      await this.initialize(false, chainId);
    }

    const snapshot = await getProposalVotingPowerSnapshot(
      this.contract,
      proposalId,
    );
    return Number(snapshot);
  }

  /**
   * Get the hook address for a proposal (if any)
   */
  async getProposalHook(proposalId: number, chainId?: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize(false, chainId);
    }

    const hook = await getProposalHook(this.contract, proposalId);
    return hook;
  }

  /**
   * Get all active proposal IDs
   */
  async getActiveProposals(chainId?: string): Promise<number[]> {
    if (!this.initialized) {
      await this.initialize(false, chainId);
    }

    const proposals = await getActiveProposals(this.contract);
    return proposals.map((id: string) => Number(id));
  }

  /**
   * Get comprehensive information about a proposal
   */
  async getProposalInfo(
    proposalId: number,
    chainId?: string,
  ): Promise<ProposalInfo> {
    if (!this.initialized) {
      await this.initialize(false, chainId);
    }

    const [state, votes, tokenVotes, details, snapshot, hook] =
      await Promise.all([
        this.getProposalState(proposalId, chainId),
        this.getProposalVotes(proposalId, chainId),
        this.getTokenProposalVotes(proposalId, chainId),
        this.getProposalDetails(proposalId, chainId),
        this.getVotingPowerSnapshot(proposalId, chainId),
        this.getProposalHook(proposalId, chainId),
      ]);

    return {
      proposalId,
      state,
      votes,
      tokenVotes,
      details,
      snapshot,
      hook,
    };
  }

  /**
   * Utility method to get human-readable proposal state
   */
  static getProposalStateName(state: ProposalState): string {
    switch (state) {
      case ProposalState.Pending:
        return 'Pending';
      case ProposalState.Active:
        return 'Active';
      case ProposalState.Canceled:
        return 'Canceled';
      case ProposalState.Defeated:
        return 'Defeated';
      case ProposalState.Succeeded:
        return 'Succeeded';
      case ProposalState.Queued:
        return 'Queued';
      case ProposalState.Expired:
        return 'Expired';
      case ProposalState.Executed:
        return 'Executed';
      default:
        return 'Unknown';
    }
  }

  /**
   * Utility method to get human-readable vote support
   */
  static getVoteSupportName(support: VoteSupport): string {
    switch (support) {
      case VoteSupport.Against:
        return 'Against';
      case VoteSupport.For:
        return 'For';
      case VoteSupport.Abstain:
        return 'Abstain';
      default:
        return 'Unknown';
    }
  }
}

export default VoteGovernance;
