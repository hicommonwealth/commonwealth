// Approve ERC20 token transfer if allowance is insufficient
export const approveTokenTransfer = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokenContract: any,
  spender: string,
  amount: string,
  walletAddress: string,
) => {
  try {
    const allowance = await tokenContract.methods
      .allowance(walletAddress, spender)
      .call();
    if (BigInt(allowance) < BigInt(amount)) {
      await tokenContract.methods.approve(spender, amount).send({
        from: walletAddress,
      });
    }
  } catch (error) {
    console.error('Error approving token transfer:', error);
    throw error;
  }
};

export const launchPostToken = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  name: string,
  symbol: string,
  shares: number[],
  holders: string[],
  totalSupply: string, // Default 1B tokens in Wei
  walletAddress: string,
  connectorWeight: number,
  tokenCommunityManager: string,
  threadId: number,
  exchangeToken: string,
  curveId: number = 1,
  scalar: number = 0,
  lphook: string = '0x0000000000000000000000000000000000000000',
) => {
  try {
    const txReceipt = await contract.methods
      .launchTokenWithLiquidity(
        name,
        symbol,
        shares,
        holders,
        totalSupply,
        curveId,
        scalar,
        lphook,
        tokenCommunityManager,
        connectorWeight,
        threadId,
        exchangeToken,
      )
      .send({ from: walletAddress, value: 0 });
    return txReceipt;
  } catch (error) {
    console.error('Error launching token:', error);
    throw error;
  }
};

export const buyPostToken = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  tokenAddress: string,
  recipient: string,
  amountIn: string,
  minAmountOut: string,
  walletAddress: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentTokenContract: any,
) => {
  try {
    await approveTokenTransfer(
      paymentTokenContract,
      contract.options.address,
      amountIn,
      walletAddress,
    );

    const txReceipt = await contract.methods
      .buyToken(tokenAddress, recipient, amountIn, minAmountOut)
      .send({ from: walletAddress, value: 0 });
    return txReceipt;
  } catch (error) {
    console.error('Error buying token:', error);
    throw error;
  }
};

export const sellPostToken = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  tokenAddress: string,
  amount: string,
  minAmountOut: string,
  walletAddress: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokenContract: any,
) => {
  try {
    await approveTokenTransfer(
      tokenContract,
      contract.options.address,
      amount,
      walletAddress,
    );

    const txReceipt = await contract.methods
      .sellToken(tokenAddress, amount, minAmountOut)
      .send({ from: walletAddress, value: 0 });
    return txReceipt;
  } catch (error) {
    console.error('Error selling token:', error);
    throw error;
  }
};

export const transferPostLiquidity = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  tokenAddress: string,
  amountIn: string,
  minAmountOut: string,
  walletAddress: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentTokenContract: any,
) => {
  try {
    await approveTokenTransfer(
      paymentTokenContract,
      contract.options.address,
      amountIn,
      walletAddress,
    );

    const txReceipt = await contract.methods
      .transferLiquidity(tokenAddress, amountIn, minAmountOut)
      .send({ from: walletAddress, value: 0 });
    return txReceipt;
  } catch (error) {
    console.error('Error transferring liquidity:', error);
    throw error;
  }
};

export const getPostPrice = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  tokenAddress: string,
  amountIn: number,
  isBuy: boolean,
) => {
  const price = await contract.methods.getPrice(tokenAddress, amountIn, isBuy);
  return price.call();
};
