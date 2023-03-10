import { ChainBase } from 'common-common/src/types';
import { processAbiInputsToDataTypes } from 'helpers/abi_form_helpers';
import app from 'state';
import type Web3 from 'web3';
import type { TransactionConfig, TransactionReceipt } from 'web3-core/types';
import type { AbiItem } from 'web3-utils';
import type Contract from 'models/Contract';
import type { IWebWallet } from 'models';
import { ethers } from 'ethers';
import type { Result } from 'ethers/lib/utils';

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
      data: functionTx,
    };
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
  const ethersInterface = new ethers.utils.Interface(contract.abi);
  const functionTx = ethersInterface.encodeFunctionData(fn.name, processedArgs);
  const txReceipt: TransactionReceipt | any = await sendFunctionCall(
    fn,
    signingWallet,
    contract,
    functionTx,
    web3
  );
  return ethersInterface.decodeFunctionResult(fn.name, txReceipt);
}
