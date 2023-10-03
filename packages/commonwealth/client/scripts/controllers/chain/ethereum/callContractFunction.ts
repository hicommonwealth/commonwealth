import { ChainBase } from 'common-common/src/types';
import { processAbiInputsToDataTypes } from 'helpers/abi_form_helpers';
import app from 'state';
import type Web3 from 'web3';
import type { TransactionConfig, TransactionReceipt } from 'web3-core/types';
import type { AbiItem } from 'web3-utils';
import type Contract from 'models/Contract';
import type IWebWallet from 'models/IWebWallet';
import { ethers } from 'ethers';
import WebWalletController from '../../app/web_wallets';
import MetamaskWebWalletController from '../../app/webWallets/metamask_web_wallet';

//NOTE: This should be condensed into contract helpers once that becomes available
const abi = [
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    name: 'getNamespace',
    outputs: [
      {
        internalType: 'contract INamespace',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'contract IGate',
        name: 'gate',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'name',
        type: 'bytes32',
      },
      {
        components: [
          {
            internalType: 'bytes32',
            name: 'gateType',
            type: 'bytes32',
          },
          {
            internalType: 'address',
            name: 'customGate',
            type: 'address',
          },
          {
            internalType: 'bytes',
            name: 'gateData',
            type: 'bytes',
          },
        ],
        internalType: 'struct CommonFactoryV1.GateInitialization',
        name: 'gateConfig',
        type: 'tuple',
      },
    ],
    name: 'createNamespace',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const compGovAbi = {
  constant: false,
  inputs: [
    { internalType: 'address[]', name: 'targets', type: 'address[]' },
    { internalType: 'uint256[]', name: 'values', type: 'uint256[]' },
    { internalType: 'string[]', name: 'signatures', type: 'string[]' },
    { internalType: 'bytes[]', name: 'calldatas', type: 'bytes[]' },
    { internalType: 'string', name: 'description', type: 'string' },
  ],
  name: 'propose',
  outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
  payable: false,
  stateMutability: 'nonpayable',
  type: 'function',
};

async function sendFunctionCall({
  fn,
  signingWallet,
  contract,
  functionTx,
  web3,
  tx_options,
}: {
  fn: AbiItem;
  signingWallet: IWebWallet<any>;
  contract: Contract;
  functionTx: any;
  web3: Web3;
  tx_options?: any;
}) {
  let txReceipt: TransactionReceipt | any;
  if (
    fn.stateMutability !== 'view' &&
    fn.stateMutability !== 'pure' &&
    fn.constant !== true
  ) {
    // Sign Tx with PK if this is write function
    let tx: TransactionConfig = {
      from: signingWallet.accounts[0],
      to: contract.address,
      data: functionTx,
    };

    tx = tx_options ? Object.assign(tx, tx_options) : tx;

    const estimate = await web3.eth.estimateGas(tx);
    tx.gas = estimate;
    txReceipt = await web3.eth.sendTransaction(tx);
  } else {
    // send call transaction
    const tx: TransactionConfig = {
      to: contract.address,
      data: functionTx,
    };
    txReceipt = await web3.givenProvider.request({
      method: 'eth_call',
      params: [tx, 'latest'],
    });
  }
  return txReceipt;
}

/**
 * Uses the current user's ETH wallet to perform a specified contract tx or call.
 *
 * We may want to consider moving this into the `IChainModule` class, as it requires
 * a loaded to chain to render the corresponding view.
 *
 * @throw Error if the contract is not found, or if the web3 api is not initialized or
 * if there is a web3 api calls are misconfigured or fail.
 * // TODO: add formInputMap shape for clarity
 */
export async function callContractFunction({
  contract,
  fn,
  inputArgs,
  tx_options,
}: {
  contract: Contract;
  fn: AbiItem;
  inputArgs: string[];
  tx_options?: any;
}): Promise<TransactionReceipt | any> {
  const sender = app.user.activeAccount;
  // get querying wallet
  const signingWallet = await WebWalletController.Instance.locateWallet(
    sender,
    ChainBase.Ethereum
  );
  if (!signingWallet.api) {
    throw new Error('Web3 Api Not Initialized');
  }
  const web3: Web3 = signingWallet.api;

  // handle processing the forms inputs into their proper data types
  const processedArgs = processAbiInputsToDataTypes(fn.inputs, inputArgs);
  const ethersInterface = new ethers.utils.Interface(contract.abi);
  const functionTx = ethersInterface.encodeFunctionData(fn.name, processedArgs);
  const functionConfig: {
    fn: AbiItem;
    signingWallet: IWebWallet<any>;
    contract: Contract;
    functionTx: any;
    web3: Web3;
    tx_options?: any;
  } = {
    fn,
    signingWallet,
    contract,
    functionTx,
    web3,
    tx_options,
  };
  const txReceipt: TransactionReceipt | any = await sendFunctionCall(
    functionConfig
  );
  return txReceipt;
}

export function encodeParameters(types, values) {
  const abiCoder = new ethers.utils.AbiCoder();
  return abiCoder.encode(types, values);
}

export async function setupCommunityContracts({
  name,
  gate,
  gateMeta,
  seedWalletMeta,
}: {
  name: string;
  gate: string;
  gateMeta: {
    token: string;
    amount: number;
    type: string;
  };
  seedWalletMeta: {
    type: string;
    amount: number;
    address: string;
  };
}) {
  const signingWallet = WebWalletController.Instance.availableWallets(
    ChainBase.Ethereum
  )[0] as MetamaskWebWalletController;
  await signingWallet.enable('5');
  if (!signingWallet.api) {
    throw new Error('Web3 Api Not Initialized');
  }
  const web3: Web3 = signingWallet.api;
  const factory = new web3.eth.Contract(
    abi as AbiItem[],
    '0xc4E27255c6D49af92DDF86d6A39ECbD9B46cB3e9'
  );

  //check that namespace doesnt exist
  const namespace = await factory.methods
    .getNamespace(web3.utils.asciiToHex(name))
    .call();
  if (
    namespace['token'] &&
    namespace['token'] !== '0x0000000000000000000000000000000000000000'
  ) {
    throw new Error('Name already used, try another name');
  }

  //1. config gate settings on gate contract

  const gateConfig = {
    gateType: web3.utils.padLeft(web3.utils.asciiToHex(gateMeta.type), 64),
    customGate: gate ?? '0x0000000000000000000000000000000000000000',
    gateData: web3.eth.abi.encodeParameters(
      ['address[]', 'uint256[]'],
      [[gateMeta.token], [gateMeta.amount]]
    ),
  };

  //2. Deploy namespace
  const txReceipt = await factory.methods
    .createNamespace(web3.utils.asciiToHex(name), gateConfig)
    .send({ from: signingWallet.accounts[0] });
  if (!txReceipt) {
    throw new Error('Transaction failed');
  }

  //Can/should be CREATE2 calc but this works for now
  const walletAddress = (
    await factory.methods.getNamespace(web3.utils.asciiToHex(name)).call()
  )['communityWallet'];

  //3. Set up wallet seed transactions
  if (seedWalletMeta.type === 'wallet' && seedWalletMeta.amount > 0) {
    web3.eth.sendTransaction({
      to: walletAddress,
      from: signingWallet.accounts[0],
      value: seedWalletMeta.amount,
    });
  } else if (seedWalletMeta.type === 'multi') {
    //TODO: Create mulit-sig prop to seedAWalletMeta.address with amount to walletAddress
  } else if (seedWalletMeta.type === 'proposal') {
    const gov = new web3.eth.Contract(
      compGovAbi as AbiItem,
      seedWalletMeta.address
    );
    await gov.methods
      .propose(
        [walletAddress],
        [seedWalletMeta.amount],
        [''],
        [''],
        'Fund Community Wallet'
      )
      .send({ from: signingWallet.accounts[0] });
  }
}
