export const launchToken = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  name: string,
  symbol: string,
  shares: number[],
  holders: string[],
  totalSupply: string,
  walletAddress: string,
  tokenCommunityManager: string,
) => {
  const txReceipt = await contract.methods
    .launchTokenWithLiquidity(
      name,
      symbol,
      shares,
      holders,
      totalSupply,
      1,
      0,
      '0x0000000000000000000000000000000000000000',
      tokenCommunityManager,
    )
    .send({ from: walletAddress, value: 0.00000011e18 });
  return txReceipt;
};

export const buyToken = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  tokenAddress: string,
  walletAddress: string,
  value: number,
) => {
  const contractCall = contract.methods.buyToken(tokenAddress, 0);
  const gasResult = await contractCall.estimateGas({
    from: walletAddress,
    value: value.toFixed(0),
  });

  const txReceipt = await contractCall.send({
    from: walletAddress,
    value: value.toFixed(0),
    gas: gasResult.toString(),
    type: '0x2',
  });
  return txReceipt;
};

export const sellToken = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  tokenAddress: string,
  amount: number,
  walletAddress: string,
  tokenContract: any,
) => {
  await tokenContract.methods.approve(tokenAddress, BigInt(amount)).send({
    from: walletAddress,
  });
  const txReceipt = await contract.methods
    .sellToken(tokenAddress, BigInt(amount), 0)
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
  const remainingTokens = await contract.methods._poolLiquidity(tokenAddress);
  const amountIn = await getAmountIn(
    contract,
    tokenAddress,
    remainingTokens,
    500000,
  );

  const txReceipt = await contract.methods
    .transferLiquidity(tokenAddress, remainingTokens)
    .send({ value: amountIn, from: walletAddress });
  return txReceipt;
};

// Returns market cap in ETH. Default variables will always return ~29.5 ETH
// Will need to be converted to USD on the client using APIs used for stake, etc
// USD Mkt Cap = ETH * USD/ETH rate
export const getTargetMarketCap = (
  initialReserve: number = 4.167e8,
  initialSupply: number = 1e18,
  currentSupply: number = 4.3e26,
  connectorWeight: number = 0.83,
  totalSupply: number = 1e9,
) => {
  const x = initialReserve / (initialSupply * connectorWeight);
  const y = (currentSupply / initialSupply) ** (1 / connectorWeight - 1);
  const price = x * y;
  return price * totalSupply;
};
