import Web3 from 'web3';
import { erc20Abi } from './abi/erc20';

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
    return;
  }

  const block = await web3.eth.getBlock(txReceipt.blockHash.toString());

  // Deployed Namespace
  const {
    0: namespace,
    // 1: feeManager,
    // 2: signature,
    // 3: namespaceDeploye,
  } = web3.eth.abi.decodeParameters(
    ['string', 'address', 'bytes', 'address'],
    txReceipt.logs[7].data!.toString(),
  );

  // TokenRegistered
  const {
    0: tokenAddress,
    1: curveId,
    2: totalSupply,
    3: launchpadLiquidity,
    4: reserveRation,
    5: initialPurchaseEthAmount,
  } = web3.eth.abi.decodeParameters(
    ['address, uint256, uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
    txReceipt.logs[16].data!.toString(),
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
      reserveRation: reserveRation as bigint,
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
}) {
  const web3 = new Web3(rpc);
  const erc20Contract = new web3.eth.Contract(erc20Abi, tokenAddress);
  const [name, symbol, totalSupply] = await Promise.all([
    erc20Contract.methods.name().call(),
    erc20Contract.methods.symbol().call(),
    erc20Contract.methods.totalSupply().call(),
  ]);
  return {
    name: name as unknown as string,
    symbol: symbol as unknown as string,
    totalSupply: totalSupply as unknown as bigint,
  };
}
