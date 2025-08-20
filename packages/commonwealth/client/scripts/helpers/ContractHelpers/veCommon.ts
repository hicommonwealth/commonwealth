// Import ABIs - these would come from '@commonxyz/common-protocol-abis' when available
// For now, using the local veBridgeAbi and assuming VeCommonAbi will be available
import {
  calculateVotingPowerForToken,
  getTokenData,
  getUserTokenIds,
  getVotingPowerForAddressTimepoint,
  getVotingPowerForUser,
  veBridgeAbi,
  veBridgeDelegateTokens,
  veBridgeLockTokens,
  veBridgeMergeTokens,
  veBridgeWithdrawTokens,
} from '@hicommonwealth/evm-protocols';
import { Contract } from 'web3';
import { AbiItem } from 'web3-utils';
import ContractBase from './ContractBase';

// Placeholder ABI for veCommon - this should be replaced with the actual ABI when available
// This contains the minimum required methods for the functions we're implementing
const veCommonAbi: AbiItem[] = [
  {
    inputs: [{ internalType: 'address', name: '_user', type: 'address' }],
    name: 'getVotingPowerForUser',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_user', type: 'address' }],
    name: 'getUserTokenIds',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'getTokenData',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'bias', type: 'uint256' },
          { internalType: 'uint256', name: 'slope', type: 'uint256' },
          {
            components: [
              { internalType: 'uint256', name: 'amount', type: 'uint256' },
              { internalType: 'uint256', name: 'end', type: 'uint256' },
              { internalType: 'uint256', name: 'start', type: 'uint256' },
              { internalType: 'bool', name: 'isPermanent', type: 'bool' },
            ],
            internalType: 'struct veCommon.LockedBalance',
            name: 'locked',
            type: 'tuple',
          },
        ],
        internalType: 'struct veCommon.TokenData',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'calculateVotingPowerForToken',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_user', type: 'address' },
      { internalType: 'uint256', name: 'timepoint', type: 'uint256' },
    ],
    name: 'getVotingPowerForAddressTimepoint',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as AbiItem[];

/**
 * @title VeCommonHelper - A helper class for interacting with veBridge and veCommon contracts
 * @notice This class provides easy-to-use methods for veToken operations like locking, withdrawing, and voting power queries
 * @dev Extends ContractBase to handle web3 initialization and gas estimation
 */
class VeCommonHelper extends ContractBase {
  veBridgeAddress: string;
  veCommonAddress: string;
  veBridgeContract: Contract<typeof veBridgeAbi>;
  veCommonContract: Contract<typeof veCommonAbi>;

  constructor(veBridgeAddress: string, veCommonAddress: string, rpc: string) {
    super(veBridgeAddress, veBridgeAbi, rpc);
    this.veBridgeAddress = veBridgeAddress;
    this.veCommonAddress = veCommonAddress;
  }

  async initialize(
    withWallet?: boolean,
    chainId?: string | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providerInstance?: any,
  ): Promise<void> {
    await super.initialize(withWallet, chainId, providerInstance);

    this.veBridgeContract = new this.web3.eth.Contract(
      veBridgeAbi,
      this.veBridgeAddress,
    );

    this.veCommonContract = new this.web3.eth.Contract(
      veCommonAbi,
      this.veCommonAddress,
    );
  }

  // veBridge functions
  /**
   * @notice Lock COMMON tokens to receive veCommon tokens
   * @param amount Amount of COMMON tokens to lock (in wei string format)
   * @param lockDuration Duration of the lock in seconds
   * @param isPermanent Whether the lock is permanent (true) or time-locked (false)
   * @param walletAddress Address of the wallet performing the transaction
   * @param chainId Chain ID for the transaction
   * @param providerInstance Optional provider instance
   * @returns Transaction receipt
   */
  async lockTokens(
    amount: string,
    lockDuration: number,
    isPermanent: boolean,
    walletAddress: string,
    chainId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providerInstance?: any,
  ) {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true, chainId, providerInstance);
    }

    const maxFeePerGas = await this.estimateGas();
    const txReceipt = await veBridgeLockTokens(
      this.veBridgeContract,
      amount,
      lockDuration,
      isPermanent,
      walletAddress,
      maxFeePerGas!,
    );
    return txReceipt;
  }

  /**
   * @notice Withdraw COMMON tokens by burning veCommon token (only for expired time-locked tokens)
   * @param tokenId ID of the veCommon token to burn
   * @param walletAddress Address of the wallet performing the transaction
   * @param chainId Chain ID for the transaction
   * @param providerInstance Optional provider instance
   * @returns Transaction receipt
   */
  async withdrawTokens(
    tokenId: string,
    walletAddress: string,
    chainId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providerInstance?: any,
  ) {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true, chainId, providerInstance);
    }

    const maxFeePerGas = await this.estimateGas();
    const txReceipt = await veBridgeWithdrawTokens(
      this.veBridgeContract,
      tokenId,
      walletAddress,
      maxFeePerGas!,
    );
    return txReceipt;
  }

  /**
   * @notice Merge two veCommon tokens into one
   * @param fromTokenId ID of the token to merge from (will be burned)
   * @param toTokenId ID of the token to merge to (will receive combined amount)
   * @param walletAddress Address of the wallet performing the transaction
   * @param chainId Chain ID for the transaction
   * @param providerInstance Optional provider instance
   * @returns Transaction receipt
   */
  async mergeTokens(
    fromTokenId: string,
    toTokenId: string,
    walletAddress: string,
    chainId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providerInstance?: any,
  ) {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true, chainId, providerInstance);
    }

    const maxFeePerGas = await this.estimateGas();
    const txReceipt = await veBridgeMergeTokens(
      this.veBridgeContract,
      fromTokenId,
      toTokenId,
      walletAddress,
      maxFeePerGas!,
    );
    return txReceipt;
  }

  /**
   * @notice Delegate a veCommon token's voting power to another address
   * @param tokenId ID of the token to delegate
   * @param delegatee Address to delegate the voting power to
   * @param walletAddress Address of the wallet performing the transaction
   * @param chainId Chain ID for the transaction
   * @param providerInstance Optional provider instance
   * @returns Transaction receipt
   */
  async delegateTokens(
    tokenId: string,
    delegatee: string,
    walletAddress: string,
    chainId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providerInstance?: any,
  ) {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true, chainId, providerInstance);
    }

    const maxFeePerGas = await this.estimateGas();
    const txReceipt = await veBridgeDelegateTokens(
      this.veBridgeContract,
      tokenId,
      delegatee,
      walletAddress,
      maxFeePerGas!,
    );
    return txReceipt;
  }

  // veCommon functions
  /**
   * @notice Get the total voting power for a user (sum of all their veCommon tokens)
   * @param userAddress Address to query voting power for
   * @param chainId Chain ID for the query
   * @returns Voting power as a number (converted from wei)
   */
  async getVotingPowerForUser(userAddress: string, chainId: string) {
    if (!this.initialized) {
      await this.initialize(false, chainId);
    }

    const votingPower = await getVotingPowerForUser(
      this.veCommonContract,
      userAddress,
    );
    return Number(votingPower) / 1e18; // Assuming 18 decimals
  }

  async getUserTokenIds(userAddress: string, chainId: string) {
    if (!this.initialized) {
      await this.initialize(false, chainId);
    }

    const tokenIds = await getUserTokenIds(this.veCommonContract, userAddress);
    return tokenIds;
  }

  async getTokenData(tokenId: string, chainId: string) {
    if (!this.initialized) {
      await this.initialize(false, chainId);
    }

    const tokenData = await getTokenData(this.veCommonContract, tokenId);
    return tokenData;
  }

  async calculateVotingPowerForToken(tokenId: string, chainId: string) {
    if (!this.initialized) {
      await this.initialize(false, chainId);
    }

    const votingPower = await calculateVotingPowerForToken(
      this.veCommonContract,
      tokenId,
    );
    return Number(votingPower) / 1e18; // Assuming 18 decimals
  }

  async getVotingPowerForAddressTimepoint(
    userAddress: string,
    timepoint: number,
    chainId: string,
  ) {
    if (!this.initialized) {
      await this.initialize(false, chainId);
    }

    const votingPower = await getVotingPowerForAddressTimepoint(
      this.veCommonContract,
      userAddress,
      timepoint,
    );
    return Number(votingPower) / 1e18; // Assuming 18 decimals
  }
}

export default VeCommonHelper;
