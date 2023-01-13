import { ChainBase } from 'common-common/src/types';
import {
  encodeFunctionSignature,
  processAbiInputsToDataTypes,
} from 'helpers/abi_form_helpers';
import { parseAbiItemsFromABI } from 'abi_utils';
import app from 'state';
import Web3 from 'web3';
import { TransactionConfig, TransactionReceipt } from 'web3-core/types';
import { AbiItem, AbiOutput } from 'web3-utils';
import Contract from 'client/scripts/models/Contract';
import { IWebWallet } from 'client/scripts/models';
import { ethers } from 'ethers';
import { Result } from 'ethers/lib/utils';

/**
 * Uses the function Abi Item and processed arguments to encode a function call.
 * @return encoded function call transaction hash
 */

function encodeFunctionCall(
  web3: Web3,
  fn: AbiItem,
  contract: Contract,
  processedArgs: any[]
) {
  const methodSignature = encodeFunctionSignature(fn);
  const functionContract = new web3.eth.Contract(
    parseAbiItemsFromABI(contract.abi),
    contract.address
  );

  const functionTx = functionContract.methods[methodSignature](
    ...processedArgs
  );
  return functionTx;
}

async function sendFunctionCall(
  fn: AbiItem,
  signingWallet: IWebWallet<any>,
  contract: Contract,
  functionTx: any,
  web3: Web3
) {
  let txReceipt: TransactionReceipt | any;
  if (
    fn.stateMutability !== 'view' &&
    fn.stateMutability !== 'pure' &&
    fn.constant !== true
  ) {
    // Sign Tx with PK if this is write function
    const tx: TransactionConfig = {
      from: signingWallet.accounts[0],
      to: contract.address,
      data: functionTx.encodeABI(),
    };
    txReceipt = await web3.eth.sendTransaction(tx);
  } else {
    // send call transaction
    const tx: TransactionConfig = {
      to: contract.address,
      data: functionTx.encodeABI(),
    };
    txReceipt = await web3.givenProvider.request({
      method: 'eth_call',
      params: [tx, 'latest'],
    });
  }
  return txReceipt;
}

/**
 * Uses the tx hash and function outputs to decodes the transaction data from the hash.
 */
async function decodeTransactionData(
  abi: Record<string, unknown>[],
  fnName: string,
  tx: any
): Promise<Result> {
  try {
    const ethersInterface = new ethers.utils.Interface(abi);
    // const txFunctionFragment = ethersInterface.getFunction(fnName)
    const functionResult: Result = ethersInterface.decodeFunctionResult(fnName, tx)
    return functionResult;
  } catch (error) {
    console.error('Transaction Data Decoding Failed:', error);
    throw new Error(`Transaction Data Decoding Failed: ${error}`);
  }
}

/**
 * Uses the current user's ETH wallet to perform a specified contract tx or call.
 *
 * We may want to consider moving this into the `IChainModule` class, as it requires
 * a loaded to chain to render the corresponding view.
 *
 * @throw Error if the contract is not found, or if the web3 api is not initialized or
 * if there is a web3 api calls are misconfigured or fail.
 */
export async function callContractFunction(
  contract: Contract,
  fn: AbiItem,
  formInputMap: Map<string, Map<number, string>>
): Promise<Result> {
  const sender = app.user.activeAccount;
  // get querying wallet
  const signingWallet = await app.wallets.locateWallet(
    sender,
    ChainBase.Ethereum
  );
  if (!signingWallet.api) {
    throw new Error('Web3 Api Not Initialized');
  }
  const web3: Web3 = signingWallet.api;

  // handle processing the forms inputs into their proper data types
  const processedArgs = processAbiInputsToDataTypes(
    fn.name,
    fn.inputs,
    formInputMap
  );

  const functionTx = encodeFunctionCall(web3, fn, contract, processedArgs);
  const txReceipt: TransactionReceipt | any = await sendFunctionCall(
    fn,
    signingWallet,
    contract,
    functionTx,
    web3
  );
  return decodeTransactionData(contract.abi, fn.name, txReceipt);
}
