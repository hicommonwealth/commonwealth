import { LPBondingCurveAbi } from '@commonxyz/common-protocol-abis';
import { EvmEventSignatures } from '@hicommonwealth/evm-protocols';
import { Web3 } from 'web3';
import { createPrivateEvmClient, getTransaction, withRetries } from '../utils';
import { getErc20TokenInfo } from './tokens';

export const launchToken = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  name: string,
  symbol: string,
  shares: number[],
  holders: string[],
  totalSupply: string,
  walletAddress: string,
  connectorWeight: number,
  tokenCommunityManager: string,
  value: number = 4.4400042e14,
  maxFeePerGas?: bigint,
  chainId?: string,
) => {
  const contractCall = await contract.methods.launchTokenWithLiquidity(
    name,
    symbol,
    shares,
    holders,
    totalSupply,
    1,
    0,
    chainId === '8453'
      ? '0x8e67278d7782dB5e2E07c02206F219A2F495d493'
      : '0x0000000000000000000000000000000000000000',
    tokenCommunityManager,
    connectorWeight,
  );
  const gasResult = await contractCall.estimateGas({
    from: walletAddress,
    value: value.toFixed(0),
  });

  // Calculate maxPriorityFeePerGas as 1/3 of maxFeePerGas if provided
  const maxPriorityFeePerGas = maxFeePerGas ? maxFeePerGas / 3n : undefined;

  const txReceipt = contractCall.send({
    from: walletAddress,
    value,
    type: '0x2',
    gas: gasResult.toString(),
    maxFeePerGas: maxFeePerGas ? maxFeePerGas * 2n : undefined,
    maxPriorityFeePerGas,
  });
  return txReceipt;
};

export const buyToken = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  tokenAddress: string,
  walletAddress: string,
  value: number,
  maxFeePerGas?: bigint,
) => {
  const contractCall = contract.methods.buyToken(tokenAddress, 0);
  const gasResult = await contractCall.estimateGas({
    from: walletAddress,
    value: value.toFixed(0),
  });

  // Calculate maxPriorityFeePerGas as 1/3 of maxFeePerGas if provided
  const maxPriorityFeePerGas = maxFeePerGas ? maxFeePerGas / 3n : undefined;

  const txReceipt = await contractCall.send({
    from: walletAddress,
    value: value.toFixed(0),
    gas: gasResult ? gasResult.toString() : undefined,
    type: '0x2',
    maxFeePerGas: maxFeePerGas ? maxFeePerGas * 2n : undefined,
    maxPriorityFeePerGas,
  });
  return txReceipt;
};

export const sellToken = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  tokenAddress: string,
  amount: number,
  walletAddress: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokenContract: any,
  maxFeePerGas?: bigint,
) => {
  // Calculate maxPriorityFeePerGas as 1/3 of maxFeePerGas if provided
  const maxPriorityFeePerGas = maxFeePerGas ? maxFeePerGas / 3n : undefined;

  await tokenContract.methods
    .approve(contract.options.address, BigInt(amount))
    .send({
      from: walletAddress,
      maxFeePerGas: maxFeePerGas ? maxFeePerGas * 2n : undefined,
      maxPriorityFeePerGas,
      type: '0x2',
    });
  const txReceipt = await contract.methods
    .sellToken(tokenAddress, BigInt(amount), 0)
    .send({
      from: walletAddress,
      type: '0x2',
      maxFeePerGas: maxFeePerGas ? maxFeePerGas * 2n : undefined,
      maxPriorityFeePerGas,
    });
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
  return price.call();
};

export const getAmountIn = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  tokenAddress: string,
  amountOut: number,
  cw: number,
) => {
  const data = await Promise.all([
    contract.methods._getFloatingTokenSupply(tokenAddress).call(),
    contract.methods.liquidity(tokenAddress).call(),
  ]);
  const delta =
    ((Number(amountOut) + Number(data[0])) / Number(data[0])) **
    (Number(1000000) / Number(cw));
  return Number(data[1]) * delta - Number(data[1]);
};

export const transferLiquidity = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  tokenAddress: string,
  walletAddress: string,
  maxFeePerGas?: bigint,
) => {
  const remainingTokens = await contract.methods
    ._poolLiquidity(tokenAddress)
    .call();
  const amountIn = await getAmountIn(
    contract,
    tokenAddress,
    Number(remainingTokens),
    830000,
  );

  // Calculate maxPriorityFeePerGas as 1/3 of maxFeePerGas if provided
  const maxPriorityFeePerGas = maxFeePerGas ? maxFeePerGas / 3n : undefined;

  const txReceipt = await contract.methods
    .transferLiquidity(tokenAddress, remainingTokens)
    .send({
      value: amountIn,
      from: walletAddress,
      type: '0x2',
      maxFeePerGas: maxFeePerGas ? maxFeePerGas * 2n : undefined,
      maxPriorityFeePerGas,
    });
  return txReceipt;
};

// Returns market cap in ETH. Default variables will always return ~29.5 ETH
// Will need to be converted to USD on the client using APIs used for stake, etc
// USD Mkt Cap = ETH * USD/ETH rate
export const getTargetMarketCap = (
  initialReserve: number = 4.167e8,
  initialSupply: number = 1e18,
  currentSupply: number = 4.3e26,
  connectorWeight: number = 830000,
  totalSupply: number = 1e9,
) => {
  const initialReserveVar = parseInt(
    process.env.LAUNCHPAD_INITIAL_PRICE || initialReserve.toString(),
  );
  const connectorWeightVar =
    parseInt(
      process.env.LAUNCHPAD_CONNECTOR_WEIGHT || connectorWeight.toString(),
    ) / 1000000;
  const x = initialReserveVar / (initialSupply * connectorWeightVar);
  const y = (currentSupply / initialSupply) ** (1 / connectorWeightVar - 1);
  const price = x * y;
  return price * totalSupply;
};

export async function getLaunchpadTokenCreatedTransaction({
  rpc,
  transactionHash,
}: {
  rpc: string;
  transactionHash: string;
}) {
  const web3 = new Web3(rpc);

  const txReceipt = await web3.eth.getTransactionReceipt(transactionHash);
  if (!txReceipt) {
    return;
  }

  const block = await web3.eth.getBlock(txReceipt.blockHash.toString());

  const deployedNamespaceLog = txReceipt.logs.find((l) => {
    if (l.topics && l.topics.length > 0) {
      return (
        l.topics[0].toString() ===
        EvmEventSignatures.NamespaceFactory.NamespaceDeployed
      );
    }
    return false;
  });
  if (!deployedNamespaceLog) {
    return;
  }
  const {
    0: namespace,
    // 1: feeManager,
    // 2: signature,
    // 3: namespaceDeployer,
    // 3: nameSpaceAddress,
  } = web3.eth.abi.decodeParameters(
    ['string', 'address', 'bytes', 'address', 'address'],
    deployedNamespaceLog.data!.toString(),
  );

  const tokenRegisteredLog = txReceipt.logs.find((l) => {
    if (l.topics && l.topics.length > 0) {
      return (
        l.topics[0].toString() === EvmEventSignatures.Launchpad.TokenRegistered
      );
    }
    return false;
  });
  if (!tokenRegisteredLog) {
    return;
  }
  const {
    0: curveId,
    1: totalSupply,
    2: launchpadLiquidity,
    3: reserveRatio,
    4: initialPurchaseEthAmount,
  } = web3.eth.abi.decodeParameters(
    ['uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
    tokenRegisteredLog.data!.toString(),
  );
  const tokenAddress = web3.eth.abi.decodeParameter(
    'address',
    tokenRegisteredLog.topics![1].toString(),
  );

  return {
    txReceipt,
    block,
    parsedArgs: {
      namespace: namespace as string,
      tokenAddress: tokenAddress as string,
      curveId: curveId as bigint,
      totalSupply: totalSupply as bigint,
      launchpadLiquidity: launchpadLiquidity as bigint,
      reserveRation: reserveRatio as bigint,
      initialPurchaseEthAmount: initialPurchaseEthAmount as bigint,
    },
  };
}

type LaunchpadTokenOnChainData = {
  launchpadLiquidity: bigint;
  poolLiquidity: bigint;
  curveId: bigint;
  scalar: bigint;
  reserveRation: bigint;
  LPhook: string;
  funded: boolean;
};

export async function getLaunchpadToken({
  rpc,
  lpBondingCurveAddress,
  tokenAddress,
}: {
  rpc: string;
  lpBondingCurveAddress: string;
  tokenAddress: string;
}): Promise<LaunchpadTokenOnChainData> {
  const web3 = new Web3(rpc);
  const contract = new web3.eth.Contract(
    LPBondingCurveAbi,
    lpBondingCurveAddress,
  );
  return await contract.methods.tokens(tokenAddress).call();
}

export async function transferLaunchpadLiquidityToUniswap({
  rpc,
  lpBondingCurveAddress,
  tokenAddress,
  privateKey,
}: {
  rpc: string;
  lpBondingCurveAddress: string;
  tokenAddress: string;
  privateKey: string;
}) {
  const web3 = createPrivateEvmClient({ rpc, privateKey });
  const contract = new web3.eth.Contract(
    LPBondingCurveAbi,
    lpBondingCurveAddress,
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

  return await transferLiquidity(
    contract,
    tokenAddress,
    web3.eth.defaultAccount!,
    maxFeePerGas,
  );
}

export async function getLaunchpadTokenDetails({
  rpc,
  transactionHash,
}: {
  rpc: string;
  transactionHash: string;
}): Promise<{
  name: string;
  symbol: string;
  created_at: Date;
  creator_address: string;
  token_address: string;
  namespace: string;
  curve_id: string;
  total_supply: string;
  launchpad_liquidity: string;
  reserve_ration: string;
  initial_purchase_eth_amount: string;
}> {
  const tx = await withRetries(async () => {
    const { tx: innerTx } = await getTransaction({
      rpc,
      txHash: transactionHash,
    });
    return innerTx;
  });

  const tokenData = await getLaunchpadTokenCreatedTransaction({
    rpc,
    transactionHash,
  });
  if (!tokenData) throw Error('Token data not found');

  let tokenInfo: { name: string; symbol: string; totalSupply: bigint };
  try {
    tokenInfo = await getErc20TokenInfo({
      rpc,
      tokenAddress: tokenData.parsedArgs.tokenAddress,
    });
  } catch (e) {
    throw Error(
      `Failed to get erc20 token properties for token ${tokenData.parsedArgs.tokenAddress}`,
    );
  }

  return {
    name: tokenInfo.name,
    symbol: tokenInfo.symbol,
    created_at: new Date(Number(tokenData.block.timestamp) * 1000),
    creator_address: tx.from,
    token_address: tokenData.parsedArgs.tokenAddress,
    namespace: tokenData.parsedArgs.namespace,
    curve_id: tokenData.parsedArgs.curveId.toString(),
    total_supply: tokenData.parsedArgs.totalSupply.toString(),
    launchpad_liquidity: tokenData.parsedArgs.launchpadLiquidity.toString(),
    reserve_ration: tokenData.parsedArgs.reserveRation.toString(),
    initial_purchase_eth_amount:
      tokenData.parsedArgs.initialPurchaseEthAmount.toString(),
  };
}
