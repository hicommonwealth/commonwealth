import { ChainBase } from '@hicommonwealth/shared';
import { ethers } from 'ethers';
import { processAbiInputsToDataTypes } from 'helpers/abi_form_helpers';
import type Contract from 'models/Contract';
import type IWebWallet from 'models/IWebWallet';
import app from 'state';
import type Web3 from 'web3';
import { AbiFunctionFragment, Transaction, Web3BaseProvider } from 'web3';
import WebWalletController from '../../app/web_wallets';

async function sendFunctionCall({
  fn,
  signingWallet,
  contract,
  functionTx,
  web3,
  tx_options,
}: {
  fn: AbiFunctionFragment;
  signingWallet: IWebWallet<any>;
  contract: Contract;
  functionTx: any;
  web3: Web3;
  tx_options?: any;
}) {
  let txReceipt: any;
  if (
    fn.stateMutability !== 'view' &&
    fn.stateMutability !== 'pure' &&
    fn.constant !== true
  ) {
    // Sign Tx with PK if this is write function
    let tx: Transaction = {
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
    const tx: Transaction = {
      to: contract.address,
      data: functionTx,
    };
    txReceipt = await (web3.givenProvider as Web3BaseProvider).request({
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
  fn: AbiFunctionFragment;
  inputArgs: string[];
  tx_options?: any;
}): Promise<any> {
  const sender = app.user.activeAccount;
  // get querying wallet
  const signingWallet = await WebWalletController.Instance.locateWallet(
    sender,
    ChainBase.Ethereum,
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
    fn: AbiFunctionFragment;
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
  const txReceipt: any = await sendFunctionCall(functionConfig);
  return txReceipt;
}

export function encodeParameters(types, values) {
  const abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
}
