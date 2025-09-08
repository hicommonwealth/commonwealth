import { veBridgeAbi, veCommonAbi } from '@commonxyz/common-governance-abis';
import { Contract } from 'web3';

export const veBridgeLockTokens = async (
  veBridgeContract: Contract<typeof veBridgeAbi>,
  amount: string,
  lockDuration: number,
  isPermanent: boolean,
  walletAddress: string,
  maxFeePerGas?: bigint,
) => {
  const contractCall = veBridgeContract.methods.lockTokens(
    amount,
    lockDuration,
    isPermanent,
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

export const veBridgeWithdrawTokens = async (
  veBridgeContract: Contract<typeof veBridgeAbi>,
  tokenId: string,
  walletAddress: string,
  maxFeePerGas?: bigint,
) => {
  const contractCall = veBridgeContract.methods.withdrawTokens(tokenId);

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

export const veBridgeMergeTokens = async (
  veBridgeContract: Contract<typeof veBridgeAbi>,
  fromTokenId: string,
  toTokenId: string,
  walletAddress: string,
  maxFeePerGas?: bigint,
) => {
  const contractCall = veBridgeContract.methods.mergeTokens(
    fromTokenId,
    toTokenId,
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

export const veBridgeDelegateTokens = async (
  veBridgeContract: Contract<typeof veBridgeAbi>,
  tokenId: string,
  delegatee: string,
  walletAddress: string,
  maxFeePerGas?: bigint,
) => {
  const contractCall = veBridgeContract.methods.delegate(tokenId, delegatee);

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

// veCommon contract helper functions
export const getVotingPowerForUser = async (
  veCommonContract: Contract<typeof veCommonAbi>,
  userAddress: string,
) => {
  const votingPower =
    veCommonContract.methods.getVotingPowerForUser(userAddress);
  return await votingPower.call();
};

export const getUserTokenIds = async (
  veCommonContract: Contract<typeof veCommonAbi>,
  userAddress: string,
) => {
  const tokenIds = veCommonContract.methods.getUserTokenIds(userAddress);
  return await tokenIds.call();
};

export const getTokenData = async (
  veCommonContract: Contract<typeof veCommonAbi>,
  tokenId: string,
) => {
  const tokenData = veCommonContract.methods.getTokenData(tokenId);
  return await tokenData.call();
};

export const calculateVotingPowerForToken = async (
  veCommonContract: Contract<typeof veCommonAbi>,
  tokenId: string,
) => {
  const votingPower =
    veCommonContract.methods.calculateVotingPowerForToken(tokenId);
  return await votingPower.call();
};

export const getVotingPowerForAddressTimepoint = async (
  veCommonContract: Contract<typeof veCommonAbi>,
  userAddress: string,
  timepoint: number,
) => {
  const votingPower =
    veCommonContract.methods.getVotingPowerForAddressTimepoint(
      userAddress,
      timepoint,
    );
  return await votingPower.call();
};
