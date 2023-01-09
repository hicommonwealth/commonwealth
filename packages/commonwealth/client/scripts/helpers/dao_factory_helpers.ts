import $ from 'jquery';
import m from 'mithril';
import Web3 from 'web3';
import { Contract, IWebWallet } from 'models';
import { initAppState } from 'app';
import app from 'state';
import { ChainBase, ChainType } from 'common-common/src/types';
import { linkExistingAddressToChainOrCommunity } from 'controllers/app/login';
import { parseAbiItemsFromABI, parseEventFromABI } from '../../../shared/abi_utils';
import { CreateFactoryEthDaoForm } from '../views/pages/create_community/types';
import { encodeFunctionSignature, processAbiInputsToDataTypes } from './abi_form_helpers';
import { AbiItem } from 'web3-utils';

export function decodeCuratedFactoryTx(
  web3: Web3,
  createFunctionName: string,
  tx: any,
  contract: Contract
): string | null {
  if (
    contract.nickname === 'curated-factory-goerli' &&
    createFunctionName === 'createProject'
  ) {
    const eventAbiItem = parseEventFromABI(this.contract.abi, 'ProjectCreated');
    const decodedLog = web3.eth.abi.decodeLog(
      eventAbiItem.inputs,
      tx.logs[0].data,
      tx.logs[0].topics
    );
    return decodedLog.projectAddress;
  }
  return null;
}

export async function createCuratedProjectDao(
  contractAddress: string,
  fn: AbiItem,
  formInputMap: Map<string, Map<number, string>>,
  daoForm: CreateFactoryEthDaoForm
) {
  const contract = app.contracts.getByAddress(contractAddress);
  if (!contract) {
    throw new Error('Contract not found');
  }

  const metamaskWallet =
    await app.wallets.getFirstAvailableMetamaskWallet();

  if (!metamaskWallet.api) {
    throw new Error('Web3 Api Not Initialized');
  }
  const web3: Web3 = metamaskWallet.api;

  // handle processing the forms inputs into their proper data types
  const processedArgs = processAbiInputsToDataTypes(
    fn.name,
    fn.inputs,
    formInputMap
  );

  const methodSignature = encodeFunctionSignature(fn);
  const functionContract = new web3.eth.Contract(
    parseAbiItemsFromABI(contract.abi),
    contract.address
  );

  const functionTx = functionContract.methods[methodSignature](
    ...processedArgs
  );

  if (contract.nickname === 'curated-factory-goerli') {
    const eventAbiItem = parseEventFromABI(contract.abi, 'ProjectCreated');
    // Sign Tx with PK if not view function
    const txReceipt = await this.makeContractTx(
      contract.address,
      functionTx.encodeABI(),
      metamaskWallet
    );
    const decodedLog = web3.eth.abi.decodeLog(
      eventAbiItem.inputs,
      txReceipt.logs[0].data,
      txReceipt.logs[0].topics
    );
    try {
      const res = await $.post(`${app.serverUrl()}/createChain`, {
        base: ChainBase.Ethereum,
        chain_string: daoForm.chainString,
        eth_chain_id: daoForm.ethChainId,
        jwt: app.user.jwt,
        node_url: daoForm.nodeUrl,
        token_name: daoForm.tokenName,
        type: ChainType.DAO,
        default_symbol: daoForm.symbol,
        address: decodedLog.projectAddress,
        ...daoForm,
      });
      if (res.result.admin_address) {
        await linkExistingAddressToChainOrCommunity(
          res.result.admin_address,
          res.result.role.chain_id,
          res.result.role.chain_id
        );
      }
      await initAppState(false);
      // TODO: notify about needing to run event migration
      m.route.set(`/${res.result.chain?.id}`);
    } catch (err) {
      throw new Error(err);
    }
  }
}