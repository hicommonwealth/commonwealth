export const launchToken = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  name: string,
  symbol: string,
  shares: number[],
  holders: string[],
  totalSupply: number,
  walletAddress: string,
) => {
  const txReceipt = await contract.methods
    .launchTokenWithLiquidity(
      name,
      symbol,
      shares,
      holders,
      totalSupply,
      0,
      0,
      '0x0000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000',
    )
    .send({ from: walletAddress });
  return txReceipt;
};

export const buyToken = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  tokenAddress: string,
  walletAddress: string,
  value: number,
) => {
  const txReceipt = await contract.methods.buyToken(tokenAddress).send({
    from: walletAddress,
    value,
  });
  return txReceipt;
};

export const sellToken = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  tokenAddress: string,
  amount: number,
  walletAddress: string,
) => {
  const txReceipt = await contract.methhods
    .sellToken(tokenAddress, amount)
    .send({ from: walletAddress });
  return txReceipt;
};

export const getPrice = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  tokenAddress: string,
  amountIn: number,
  isBuy: boolean,
) => {
  const price = await contract.methods.getPrice(tokenAddress, amountIn, isBuy);
  return price;
};

export const getAmountIn = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  tokenAddress: string,
  amountOut: number,
  cw: number,
) => {
  const data = await Promise.all([
    contract.methods._getFloatingTokenSupply(tokenAddress),
    contract.methods.liquidity(tokenAddress),
  ]);
  const delta =
    ((BigInt(amountOut) + BigInt(data[0])) / BigInt(data[0])) **
    (BigInt(1000000) / BigInt(cw));
  return BigInt(data[1]) * delta - BigInt(data[1]);
};

export const transferLiquidity = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  tokenAddress: string,
  walletAddress: string,
) => {
  const remainingTokens =
    await contract.methods._launchpadLiquidity(tokenAddress);
  const amountIn = await getAmountIn(
    contract,
    tokenAddress,
    remainingTokens,
    500000,
  );

  const txReceipt = await contract.methods
    .transferLiquidity(tokenAddress)
    .send({ value: amountIn, from: walletAddress });
  return txReceipt;
};
