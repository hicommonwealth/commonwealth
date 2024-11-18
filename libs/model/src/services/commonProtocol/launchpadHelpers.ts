import { logger } from '@hicommonwealth/core';
import {
  deployedNamespaceEventSignature,
  launchpadTokenRegisteredEventSignature,
  launchpadTradeEventSignature,
} from '@hicommonwealth/model';
import { commonProtocol } from '@hicommonwealth/shared';
import { Web3 } from 'web3';
import { createWeb3Provider } from './utils';

const log = logger(import.meta);

export async function getLaunchpadTradeTransaction({
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

  const tradeLog = txReceipt.logs.find((l) => {
    if (l.topics && l.topics.length > 0) {
      return l.topics[0].toString() === launchpadTradeEventSignature;
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
  } = web3.eth.abi.decodeParameters(
    ['address', 'address', 'bool', 'uint256', 'uint256', 'uint256', 'uint256'],
    txReceipt.logs[1].data!.toString(),
  );

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

export async function getTokenCreatedTransaction({
  rpc,
  transactionHash,
}: {
  rpc: string;
  transactionHash: string;
}) {
  const web3 = new Web3(rpc);

  const txReceipt = await web3.eth.getTransactionReceipt(transactionHash);
  if (!txReceipt) {
    log.debug('Transaction not found');
    return;
  }

  const block = await web3.eth.getBlock(txReceipt.blockHash.toString());

  const deployedNamespaceLog = txReceipt.logs.find((l) => {
    if (l.topics && l.topics.length > 0) {
      return l.topics[0].toString() === deployedNamespaceEventSignature;
    }
    return false;
  });
  if (!deployedNamespaceLog) {
    log.debug('DeployedNamespace log not found');
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
      return l.topics[0].toString() === launchpadTokenRegisteredEventSignature;
    }
    return false;
  });
  if (!tokenRegisteredLog) {
    log.debug('Token registered event not found');
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

export async function getErc20TokenInfo({
  rpc,
  tokenAddress,
}: {
  rpc: string;
  tokenAddress: string;
}): Promise<{ name: string; symbol: string; totalSupply: bigint }> {
  const web3 = new Web3(rpc);
  const erc20Contract = new web3.eth.Contract(
    commonProtocol.erc20Abi,
    tokenAddress,
  );
  const [name, symbol, totalSupply] = await Promise.all([
    erc20Contract.methods.name().call(),
    erc20Contract.methods.symbol().call(),
    erc20Contract.methods.totalSupply().call(),
  ]);
  return {
    name,
    symbol,
    totalSupply: totalSupply as bigint,
  };
}

export async function transferLiquidityToUniswap({
  rpc,
  lpBondingCurveAddress,
  tokenAddress,
}: {
  rpc: string;
  lpBondingCurveAddress: string;
  tokenAddress: string;
}) {
  const web3 = await createWeb3Provider(rpc);
  const contract = new web3.eth.Contract(
    commonProtocol.lpBondingCurveAbi,
    lpBondingCurveAddress,
  );
  await commonProtocol.transferLiquidity(
    contract,
    tokenAddress,
    web3.eth.defaultAccount!,
  );
}

export async function getToken({
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
    commonProtocol.lpBondingCurveAbi,
    lpBondingCurveAddress,
  );
  return await contract.methods.tokens(tokenAddress).call();
}
