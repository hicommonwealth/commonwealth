import { ChainBase } from 'common-common/src/types';
import {
  encodeFunctionSignature,
  processAbiInputsToDataTypes,
} from 'helpers/abi_form_helpers';
import { parseAbiItemsFromABI } from 'abi_utils';
import app from 'state';
import Web3 from 'web3';
import { TransactionConfig } from 'web3-core/types';
import { AbiItem, AbiOutput } from 'web3-utils';

/**
 * Uses the tx hash and function outputs to decodes the transaction data from the hash.
 */
async function decodeTransactionData(
  abiOutputs: AbiOutput[],
  tx: any
): Promise<any[]> {
  try {
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
    const decodedTxMap = web3.eth.abi.decodeParameters(
      abiOutputs.map((output) => output.type),
      tx
    );
    // complex return type
    const result = Array.from(Object.values(decodedTxMap));
    return result;
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
 */
export async function callContractFunction(
  contractAddress: string,
  fn: AbiItem,
  formInputMap: Map<string, Map<number, string>>
): Promise<any[]> {
  const contract = app.contracts.getByAddress(contractAddress);
  if (!contract) {
    throw new Error('Contract not found');
  }

  // handle processing the forms inputs into their proper data types
  const processedArgs = processAbiInputsToDataTypes(
    fn.name,
    fn.inputs,
    formInputMap
  );

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

  const methodSignature = encodeFunctionSignature(fn);
  let functionContract;
  try {
    functionContract = new web3.eth.Contract(
      parseAbiItemsFromABI(contract.abi),
      contract.address
    );
  } catch (error) {
    console.error('Failed to initialize Web3 Contract Instance: ', error);
    throw new Error(`Failed to initialize Web3 Contract Instance: ${error}`);
  }

  const functionTx = functionContract.methods[methodSignature](
    ...processedArgs
  );
  try {
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
      const txReceipt = await web3.eth.sendTransaction(tx);
      return decodeTransactionData(fn.outputs, txReceipt);
    } else {
      // send call transaction
      const tx: TransactionConfig = {
        to: contract.address,
        data: functionTx.encodeABI(),
      };
      const txResult = await web3.givenProvider.request({
        method: 'eth_call',
        params: [tx, 'latest'],
      });
      return decodeTransactionData(fn.outputs, txResult);
    }
  } catch (error) {
    console.log(error);
    throw new Error(`Contract Call Tx Failed with ${error}`);
  }
}
