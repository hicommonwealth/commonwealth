import { factory, formatFilename } from 'common-common/src/logging';
import AbiCoder from 'web3-eth-abi';
import { ChainNodeInstance } from '../../../models/chain_node';
import { rollbar } from '../../rollbar';
import { Balances } from '../types';

const log = factory.getLogger(formatFilename(__filename));

export type GetErc1155BalancesOptions = {
  chainNode: ChainNodeInstance;
  addresses: string[];
  contractAddress: string;
  tokenId: number;
};

export async function __getErc1155Balances(options: GetErc1155BalancesOptions) {
  if (options.addresses.length === 0) {
    return {};
  }

  const rpcEndpoint = options.chainNode.private_url || options.chainNode.url;
  if (options.addresses.length === 1) {
    return await getErc1155Balance(
      options.chainNode.eth_chain_id,
      rpcEndpoint,
      options.contractAddress,
      options.tokenId,
      options.addresses[0],
    );
  } else {
    return await getOnChainBatchErc1155Balances(
      options.chainNode.eth_chain_id,
      rpcEndpoint,
      options.contractAddress,
      options.tokenId,
      options.addresses,
    );
  }
}

async function getOnChainBatchErc1155Balances(
  evmChainId: number,
  rpcEndpoint: string,
  contractAddress: string,
  tokenId: number,
  addresses: string[],
): Promise<Balances> {
  const BATCH_SIZE = 1000;
  const rpcRequests = [];

  for (
    let startIndex = 0;
    startIndex < addresses.length;
    startIndex += BATCH_SIZE
  ) {
    const endIndex = Math.min(startIndex + BATCH_SIZE, addresses.length);
    const batchAddresses = addresses.slice(startIndex, endIndex);

    const calldata =
      '0x4e1273f4' +
      AbiCoder.encodeParameters(
        ['address[]', 'uint256[]'],
        [batchAddresses, Array(batchAddresses.length).fill(tokenId)],
      ).substring(2);

    rpcRequests.push({
      method: 'eth_call',
      params: [
        {
          to: contractAddress,
          data: calldata,
        },
        'latest',
      ],
      id: startIndex,
      jsonrpc: '2.0',
    });
  }

  // returns an array of responses where each responses data contains an array of balances
  const response = await fetch(rpcEndpoint, {
    method: 'POST',
    body: JSON.stringify(rpcRequests),
    headers: { 'Content-Type': 'application/json' },
  });

  const datas = await response.json();
  const addressBalanceMap = {};

  if (datas.error) {
    const msg =
      `On-chain batch request failed ` +
      `with batch size ${BATCH_SIZE} on evm chain id ${evmChainId} for contract ${contractAddress}.`;
    rollbar.error(msg, datas.error);
    log.error(msg, datas.error);
    return {};
  } else {
    for (const data of datas) {
      if (data.error) {
        const msg = `balanceOfBatch request failed on EVM chain id: ${evmChainId} for contract ${contractAddress}`;
        rollbar.error(msg, data.error);
        log.error(msg, data.error);
        continue;
      }
      const balances = AbiCoder.decodeParameter('uint256[]', data.result);
      // this replicates the batches used when creating the requests
      // note -> data.id is the startIndex defined in the loop above
      const endIndex = Math.min(data.id + BATCH_SIZE, addresses.length);
      const relevantAddresses = addresses.splice(data.id, endIndex);
      relevantAddresses.forEach(
        (key, i) => (addressBalanceMap[key] = balances[i]),
      );
    }
  }

  return addressBalanceMap;
}

async function getErc1155Balance(
  evmChainId: number,
  rpcEndpoint: string,
  contractAddress: string,
  tokenId: number,
  address: string,
): Promise<Balances> {
  const calldata =
    '0x00fdd58e' +
    AbiCoder.encodeParameters(
      ['address', 'uint256'],
      [address, tokenId],
    ).substring(2);
  const requestBody = {
    method: 'eth_call',
    params: [
      {
        to: contractAddress,
        data: calldata,
      },
      'latest',
    ],
    id: 1,
    jsonrpc: '2.0',
  };
  const response = await fetch(rpcEndpoint, {
    method: 'POST',
    body: JSON.stringify(requestBody),
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();

  if (data.error) {
    const msg =
      `ERC1155 balance fetch failed for address ${address} ` +
      `on evm chain id ${evmChainId} on contract ${contractAddress}.`;
    rollbar.error(msg, data.error);
    log.error(msg, data.error);
    return {};
  } else {
    return {
      [address]: AbiCoder.decodeParameter(
        'uint256',
        data.result,
      ) as unknown as string,
    };
  }
}
