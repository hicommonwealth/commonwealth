import { sepolia } from '@alchemy/aa-core';
import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype';
import {
  Abi,
  AbiParameterToPrimitiveType,
  Chain,
  ContractEventName,
  ContractFunctionName,
  createPublicClient,
  createWalletClient,
  decodeEventLog,
  DecodeEventLogParameters,
  DecodeEventLogReturnType,
  getAddress,
  Hex,
  http,
  publicActions,
  TransactionExecutionError,
} from 'viem';
import {
  english,
  generateMnemonic,
  generatePrivateKey,
  mnemonicToAccount,
  privateKeyToAccount,
} from 'viem/accounts';
import {
  anvil,
  arbitrum,
  base,
  baseSepolia,
  blast,
  bsc,
  linea,
  mainnet,
  optimism,
  skaleCalypsoTestnet,
} from 'viem/chains';
import Web3, { AbiInput, TransactionReceipt, Web3 as Web3Type } from 'web3';
import * as AbiCoder from 'web3-eth-abi';
import { isAddress } from 'web3-validator';
import { ValidChains } from './chainConfig';

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
>({
  abi,
  data,
  topics,
}: {
  abi: abi;
  eventName: eventName;
  data: string;
  topics: string[];
}) {
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

export const ViemChains: Record<ValidChains, Chain> = {
  [ValidChains.Base]: base,
  [ValidChains.SepoliaBase]: baseSepolia,
  [ValidChains.Sepolia]: sepolia,
  [ValidChains.Blast]: blast,
  [ValidChains.Linea]: linea,
  [ValidChains.Optimism]: optimism,
  [ValidChains.Mainnet]: mainnet,
  [ValidChains.Arbitrum]: arbitrum,
  [ValidChains.BSC]: bsc,
  [ValidChains.Anvil]: anvil,
  [ValidChains.SKALE_TEST]: skaleCalypsoTestnet,
};

export type EvmProtocolChain = {
  eth_chain_id: ValidChains;
  rpc: string;
};

export const getPublicClient = (chain: EvmProtocolChain) => {
  return createPublicClient({
    chain: ViemChains[chain.eth_chain_id],
    transport: http(chain.rpc),
  });
};

export const getWalletClient = (
  chain: EvmProtocolChain & { private_key: string },
) => {
  const moddedChain: Chain = {
    ...ViemChains[chain.eth_chain_id],
  };
  if (moddedChain.fees) moddedChain.fees.baseFeeMultiplier = 2;
  else moddedChain.fees = { baseFeeMultiplier: 2 };

  return createWalletClient({
    chain: moddedChain,
    transport: http(chain.rpc),
    account: privateKeyToAccount(chain.private_key as `0x${string}`),
  }).extend(publicActions);
};

export type MappedArgs<
  abi extends Abi,
  functionName extends ContractFunctionName<abi>,
> = {
  [K in ExtractAbiFunction<abi, functionName>['outputs'][number] as NonNullable<
    K['name']
  >]: AbiParameterToPrimitiveType<K, 'outputs'>;
};

export function mapToAbiRes<
  abi extends Abi,
  functionName extends ContractFunctionName<abi>,
  abiFunction extends ExtractAbiFunction<abi, functionName>,
  args extends AbiParametersToPrimitiveTypes<abiFunction['outputs']>,
>(
  abi: abi,
  functionName: functionName,
  args: args,
): MappedArgs<abi, functionName> {
  const output = abi
    .find(
      (item): item is abiFunction =>
        item.type === 'function' && item.name === functionName,
    )!
    .outputs.reduce((acc, o, index) => {
      acc[(o.name as keyof args) || index] = args[index];
      return acc;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as any);
  return output;
}

export async function getBalance({
  address,
  rpcUrl,
}: {
  address: `0x${string}`;
  rpcUrl: string;
}) {
  const client = createPublicClient({
    transport: http(rpcUrl),
  });

  return await client.getBalance({
    address: address,
  });
}

export async function sendTransaction({
  privateKey,
  to,
  value,
  rpcUrl,
}: {
  privateKey: `0x${string}`;
  to: `0x${string}`;
  value: bigint;
  rpcUrl: string;
}) {
  const walletClient = createWalletClient({
    account: privateKeyToAccount(privateKey),
    transport: http(rpcUrl),
  });

  try {
    await walletClient.sendTransaction({
      chain: null,
      to,
      value,
    });
  } catch (e) {
    if (e instanceof TransactionExecutionError) {
      // Check if the error message indicates an insufficient balance
      if (e.shortMessage.includes('Account balance is too low')) {
        throw new Error('Insufficient funds on Skale address.');
      }
    }

    throw e;
  }
}

export async function generateWallet() {
  const privateKey = generatePrivateKey();
  return privateKeyToAccount(privateKey);
}
