import {
  Abi,
  ContractEventName,
  DecodeEventLogParameters,
  DecodeEventLogReturnType,
  Hex,
  decodeEventLog,
  getAddress,
} from 'viem';
import { english, generateMnemonic, mnemonicToAccount } from 'viem/accounts';
import Web3, { AbiInput, TransactionReceipt, Web3 as Web3Type } from 'web3';
import * as AbiCoder from 'web3-eth-abi';
import { isAddress } from 'web3-validator';

export type EvmClientType = Web3Type;

export const calculateVoteWeight = (
  balance: string, // should be in wei
  voteWeight: number = 0,
  precision: number = 10 ** 16, // precision factor for multiplying
): bigint | null => {
  if (!balance || voteWeight <= 0) return null;
  // solution to multiply BigInt with fractional vote weight
  const scaledVoteWeight = BigInt(Math.round(voteWeight * precision));
  return (BigInt(balance) * scaledVoteWeight) / BigInt(precision);
};

export enum Denominations {
  'ETH' = 'ETH',
}

export const WeiDecimals: Record<Denominations, number> = {
  ETH: 18,
};

export const getAddressFromSignedMessage = (
  message: string,
  signature: string,
): string => {
  const web3 = new Web3();
  return web3.eth.accounts.recover(message, signature);
};

export const getBlock = async ({
  evmClient,
  rpc,
  blockHash,
}: {
  evmClient?: EvmClientType;
  rpc: string;
  blockHash: string;
}): Promise<{
  block: Awaited<ReturnType<typeof web3.eth.getBlock>>;
  evmClient: EvmClientType;
}> => {
  const web3 = evmClient || new Web3(rpc);
  return {
    block: await web3.eth.getBlock(blockHash),
    evmClient: web3,
  };
};

export const getBlockNumber = async ({
  evmClient,
  rpc,
}: {
  evmClient?: EvmClientType;
  rpc: string;
}): Promise<number> => {
  const web3 = evmClient || new Web3(rpc);
  return Number(await web3.eth.getBlockNumber());
};

export const getTransactionReceipt = async ({
  evmClient,
  rpc,
  txHash,
}: {
  evmClient?: EvmClientType;
  rpc: string;
  txHash: string;
}): Promise<{
  txReceipt: TransactionReceipt;
  evmClient: EvmClientType;
}> => {
  const web3 = evmClient || new Web3(rpc);
  return {
    txReceipt: await web3.eth.getTransactionReceipt(txHash),
    evmClient: web3,
  };
};

export const getTransaction = async ({
  evmClient,
  rpc,
  txHash,
}: {
  evmClient?: EvmClientType;
  rpc: string;
  txHash: string;
}): Promise<{
  tx: Awaited<ReturnType<typeof web3.eth.getTransaction>>;
  evmClient: EvmClientType;
}> => {
  const web3 = evmClient || new Web3(rpc);
  return {
    tx: await web3.eth.getTransaction(txHash),
    evmClient: web3,
  };
};

export const getTransactionCount = async ({
  evmClient,
  rpc,
  address,
}: {
  evmClient?: EvmClientType;
  rpc: string;
  address: string;
}) => {
  const web3 = evmClient || new Web3(rpc);
  return Number(await web3.eth.getTransactionCount(address));
};

export const decodeParameters = ({
  abiInput,
  data,
}: {
  abiInput: AbiInput[];
  data: string;
}) => {
  return AbiCoder.decodeParameters(abiInput, data);
};

export const encodeParameters = ({
  abiInput,
  data,
}: {
  abiInput: ReadonlyArray<AbiInput>;
  data: unknown[];
}) => {
  return AbiCoder.encodeParameters(abiInput, data);
};

export const createPrivateEvmClient = ({
  rpc,
  privateKey,
}: {
  rpc?: string;
  privateKey: string;
}): Web3 => {
  const web3 = new Web3(rpc);
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;
  return web3;
};

export const estimateGas = async (web3: Web3): Promise<bigint | null> => {
  try {
    const latestBlock = await web3.eth.getBlock('latest');

    // Calculate maxFeePerGas and maxPriorityFeePerGas
    const baseFeePerGas = latestBlock.baseFeePerGas;
    const maxPriorityFeePerGas = web3.utils.toWei('0.001', 'gwei');
    return baseFeePerGas! * BigInt(2) + BigInt(parseInt(maxPriorityFeePerGas));
  } catch {
    return null;
  }
};

export const isEvmAddress = (address: string): boolean => {
  return isAddress(address);
};

export const getEvmAddress = (address: string): string => {
  return getAddress(address);
};

export const arbitraryEvmCall = async ({
  evmClient,
  rpc,
  to,
  data,
}: {
  evmClient?: EvmClientType;
  rpc: string;
  to: string;
  data: string;
}) => {
  const web3 = evmClient || new Web3(rpc);
  return await web3.eth.call({
    to,
    data,
  });
};

export function decodeLog<
  abi extends Abi,
  eventName extends ContractEventName<abi>,
>({ abi, data, topics }: { abi: abi; data: string; topics: string[] }) {
  return decodeEventLog<abi, eventName, Hex[], Hex>({
    abi,
    data: data as Hex,
    topics: topics as DecodeEventLogParameters['topics'],
  });
}

export type DecodedLog<
  abi extends Abi,
  eventName extends ContractEventName<abi>,
> = DecodeEventLogReturnType<abi, eventName>;

export const createEvmSigner = (
  mnemonic: string = generateMnemonic(english),
) => {
  const account = mnemonicToAccount(mnemonic);
  return {
    ...account,
    getAddress: () => account.address,
    signMessage: (message: string): Promise<string> =>
      account.signMessage({ message }),
  };
};
