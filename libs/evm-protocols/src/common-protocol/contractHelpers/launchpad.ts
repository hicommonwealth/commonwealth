import {
  commonProtocol,
  createPrivateEvmClient,
  decodeParameters,
  EvmEventSignatures,
  getBlock,
  getTransactionReceipt,
  lpBondingCurveAbi,
} from '@hicommonwealth/evm-protocols';
import { Web3 } from 'web3';

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
      connectorWeight,
    )
    .send({ from: walletAddress, value: 4.167e8 });
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokenContract: any,
) => {
  await tokenContract.methods
    .approve(contract.options.address, BigInt(amount))
    .send({
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

export async function getLaunchpadTradeTransaction({
  rpc,
  transactionHash,
}: {
  rpc: string;
  transactionHash: string;
}) {
  const { evmClient, txReceipt } = await getTransactionReceipt({
    rpc,
    txHash: transactionHash,
  });
  if (!txReceipt) {
    return;
  }

  const { block } = await getBlock({
    evmClient: evmClient,
    rpc,
    blockHash: txReceipt.blockHash.toString(),
  });

  const tradeLog = txReceipt.logs.find((l) => {
    if (l.topics && l.topics.length > 0) {
      return l.topics[0].toString() === EvmEventSignatures.Launchpad.Trade;
    }
    return false;
  });
  if (!tradeLog) return;

  const {
    0: traderAddress,
    1: tokenAddress,
    2: isBuy,
    3: communityTokenAmount,
    4: ethAmount,
    5: protocolEthAmount,
    6: floatingSupply,
  } = decodeParameters({
    abiInput: [
      'address',
      'address',
      'bool',
      'uint256',
      'uint256',
      'uint256',
      'uint256',
    ],
    data: txReceipt.logs[1].data!.toString(),
  });

  return {
    txReceipt,
    block,
    parsedArgs: {
      traderAddress: traderAddress as string,
      tokenAddress: tokenAddress as string,
      isBuy: isBuy as boolean,
      communityTokenAmount: communityTokenAmount as bigint,
      ethAmount: ethAmount as bigint,
      protocolEthAmount: protocolEthAmount as bigint,
      floatingSupply: floatingSupply as bigint,
    },
  };
}

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
    // 3: namespaceDeployed,
  } = web3.eth.abi.decodeParameters(
    ['string', 'address', 'bytes', 'address'],
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

export async function getLaunchpadToken({
  rpc,
  lpBondingCurveAddress,
  tokenAddress,
}: {
  rpc: string;
  lpBondingCurveAddress: string;
  tokenAddress: string;
}): Promise<{
  launchpadLiquidity: bigint;
  poolLiquidity: bigint;
  curveId: bigint;
  scalar: bigint;
  reserveRation: bigint;
  LPhook: string;
  funded: boolean;
}> {
  const web3 = new Web3(rpc);
  const contract = new web3.eth.Contract(
    lpBondingCurveAbi,
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
    lpBondingCurveAbi,
    lpBondingCurveAddress,
  );
  await commonProtocol.transferLiquidity(
    contract,
    tokenAddress,
    web3.eth.defaultAccount!,
  );
}
