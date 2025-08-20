// Note: VeCommonAbi and VeBridgeAbi would be imported from '@commonxyz/common-protocol-abis'
// when they become available. For now, we'll use any type for contracts.

// veBridge contract helper functions
export const veBridgeLockTokens = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  veBridgeContract: any,
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
    maxFeePerGas: maxFeePerGas ? maxFeePerGas * 2n : undefined,
    maxPriorityFeePerGas,
  });

  return txReceipt;
};

export const veBridgeWithdrawTokens = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  veBridgeContract: any,
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
    maxFeePerGas: maxFeePerGas ? maxFeePerGas * 2n : undefined,
    maxPriorityFeePerGas,
  });

  return txReceipt;
};

export const veBridgeMergeTokens = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  veBridgeContract: any,
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
    maxFeePerGas: maxFeePerGas ? maxFeePerGas * 2n : undefined,
    maxPriorityFeePerGas,
  });

  return txReceipt;
};

export const veBridgeDelegateTokens = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  veBridgeContract: any,
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
    maxFeePerGas: maxFeePerGas ? maxFeePerGas * 2n : undefined,
    maxPriorityFeePerGas,
  });

  return txReceipt;
};

// veCommon contract helper functions
export const getVotingPowerForUser = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  veCommonContract: any,
  userAddress: string,
) => {
  const votingPower =
    await veCommonContract.methods.getVotingPowerForUser(userAddress);
  return votingPower.call();
};

export const getUserTokenIds = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  veCommonContract: any,
  userAddress: string,
) => {
  const tokenIds = await veCommonContract.methods.getUserTokenIds(userAddress);
  return tokenIds.call();
};

export const getTokenData = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  veCommonContract: any,
  tokenId: string,
) => {
  const tokenData = await veCommonContract.methods.getTokenData(tokenId);
  return tokenData.call();
};

export const calculateVotingPowerForToken = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  veCommonContract: any,
  tokenId: string,
) => {
  const votingPower =
    await veCommonContract.methods.calculateVotingPowerForToken(tokenId);
  return votingPower.call();
};

export const getVotingPowerForAddressTimepoint = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  veCommonContract: any,
  userAddress: string,
  timepoint: number,
) => {
  const votingPower =
    await veCommonContract.methods.getVotingPowerForAddressTimepoint(
      userAddress,
      timepoint,
    );
  return votingPower.call();
};
