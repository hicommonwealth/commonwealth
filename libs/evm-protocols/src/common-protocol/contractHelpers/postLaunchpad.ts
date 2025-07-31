// Approve ERC20 token transfer if allowance is insufficient
import { TokenBondingCurveAbi } from '@commonxyz/common-protocol-abis';
import {
  createPrivateEvmClient,
  getAmountIn,
} from '@hicommonwealth/evm-protocols';
import { Web3 } from 'web3';

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
  threadId: number,
  exchangeToken: string,
  initPurchaseAmount: number,
  bondingCurveAddress: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokenContract: any,
  curveId: number = 1,
  scalar: number = 0,
) => {
  try {
    await approveTokenTransfer(
      tokenContract,
      bondingCurveAddress,
      initPurchaseAmount.toString(),
      walletAddress,
    );
    const txReceipt = await contract.methods
      .launchTokenWithLiquidity(
        name,
        symbol,
        shares,
        holders,
        totalSupply,
        curveId,
        scalar,
        '0x0000000000000000000000000000000000000000', // No LP hook
        '0x0000000000000000000000000000000000000000', // No TCM
        connectorWeight,
        threadId,
        exchangeToken,
        initPurchaseAmount,
      )
      .send({ from: walletAddress, value: 4.44e14 });
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
    const feeAmount = await contract.methods
      .getETHFeeAmount(tokenAddress, amountIn, true)
      .call();
    const txReceipt = await contract.methods
      .buyToken(tokenAddress, recipient, amountIn, minAmountOut)
      .send({ from: walletAddress, value: feeAmount });
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
    const feeAmount = await contract.methods
      .getETHFeeAmount(tokenAddress, amount, false)
      .call();
    const txReceipt = await contract.methods
      .sellToken(tokenAddress, amount, minAmountOut)
      .send({ from: walletAddress, value: feeAmount });
    return txReceipt;
  } catch (error) {
    console.error('Error selling token:', error);
    throw error;
  }
};

export async function transferPostLiquidityToUniswap({
  rpc,
  threadTokenBondingCurveAddress,
  tokenAddress,
  privateKey,
}: {
  rpc: string;
  threadTokenBondingCurveAddress: string;
  tokenAddress: string;
  privateKey: string;
}) {
  const web3 = createPrivateEvmClient({ rpc, privateKey });
  const contract = new web3.eth.Contract(
    TokenBondingCurveAbi,
    threadTokenBondingCurveAddress,
  );

  // Estimate gas
  const latestBlock = await web3.eth.getBlock('latest');
  let maxFeePerGas: bigint | undefined;

  if (latestBlock.baseFeePerGas) {
    const maxPriorityFeePerGas = web3.utils.toWei('0.001', 'gwei');
    maxFeePerGas =
      latestBlock.baseFeePerGas * BigInt(2) +
      BigInt(web3.utils.toNumber(maxPriorityFeePerGas));
  }

  const amountIn = await getAmountIn(contract, tokenAddress, 1e18, 830000);

  return await transferPostLiquidity(
    contract,
    tokenAddress,
    amountIn.toString(),
    '0',
    web3.eth.defaultAccount!,
    maxFeePerGas,
  );
}

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

export async function getPostTokenFunded({
  rpc,
  threadTokenBondingCurveAddress,
  tokenAddress,
}: {
  rpc: string;
  threadTokenBondingCurveAddress: string;
  tokenAddress: string;
}): Promise<boolean> {
  const web3 = new Web3(rpc);
  const contract = new web3.eth.Contract(
    TokenBondingCurveAbi,
    threadTokenBondingCurveAddress,
  );
  const { funded } = await contract.methods.tokens(tokenAddress).call();

  return funded;
}

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
