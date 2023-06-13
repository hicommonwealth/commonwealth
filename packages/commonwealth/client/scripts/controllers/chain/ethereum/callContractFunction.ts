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
import { sendUserOp } from 'helpers/aa_op_builder';

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

export async function get4337Account (web3: Web3, eoaAddress: string){
  const abi = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "getAccount",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
  const factory = new web3.eth.Contract(abi as AbiItem[], '0xb28A7002bC67e61b31dCe32C079D7146Bf43ae60')
  const accountAddr = await factory.methods.getAccount(eoaAddress).call();
  return accountAddr;
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
  senderERC4337
}: {
  contract: Contract;
  fn: AbiItem;
  inputArgs: string[];
  tx_options?: any;
  senderERC4337?: boolean
}): Promise<TransactionReceipt | any> {
  const sender = app.user.activeAccount;
  console.log(sender)
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
  if(!senderERC4337){
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
  }else{
    const accountAddr = await get4337Account(web3, signingWallet.accounts[0])
    const userOpEvent = await sendUserOp(
      web3,
      accountAddr,
      contract.address,
      tx_options?.value ?? "0",
      functionTx 
      )
    return await userOpEvent.getTransactionReceipt()
  }
}

export function encodeParameters(types, values) {
  const abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
}
