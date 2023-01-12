import $ from 'jquery';
import m from 'mithril';
import Web3 from 'web3';
import { Contract, IWebWallet } from 'models';
import { initAppState } from 'app';
import app from 'state';
import { ChainBase, ChainType } from 'common-common/src/types';
import { linkExistingAddressToChainOrCommunity } from 'controllers/app/login';
import { AbiItem } from 'web3-utils';
import { TransactionConfig } from 'web3-core';
import {
  parseAbiItemsFromABI,
  parseEventFromABI,
} from '../../../shared/abi_utils';
import { CreateFactoryEthDaoForm } from '../views/pages/create_community/types';
import {
  encodeFunctionSignature,
  processAbiInputsToDataTypes,
} from './abi_form_helpers';
import ContractAbi from '../models/ContractAbi';

export function decodeCreateDaoTx(
  web3: Web3,
  contractAbi: ContractAbi,
  tx: any
): string | null {
  const eventAbiItem = parseEventFromABI(
    contractAbi.abi,
    contractAbi.create_dao_event_name
  );
  const decodedLog = web3.eth.abi.decodeLog(
    eventAbiItem.inputs,
    tx.logs[0].data,
    tx.logs[0].topics
  );
  return decodedLog[contractAbi.create_dao_event_parameter];
}

export async function createCuratedProjectDao(
  contract: Contract,
  fn: AbiItem,
  formInputMap: Map<string, Map<number, string>>,
  daoForm: CreateFactoryEthDaoForm
) {
  const signingWallet: IWebWallet<any> =
    await app.wallets.getFirstAvailableMetamaskWallet();

  const ethChainId = contract.ethChainId

  signingWallet.enableForEthChainId(ethChainId);

  if (!signingWallet.api) {
    throw new Error('Web3 Api Not Initialized');
  }
  const web3: Web3 = signingWallet.api;

  if (formInputMap.size === 0) {
    throw new Error('Must Insert Inputs');
  }
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

  // Sign Tx with PK if this is write function
  const tx: TransactionConfig = {
    from: signingWallet.accounts[0],
    to: contract.address,
    data: functionTx.encodeABI(),
  };
  const txReceipt = await web3.eth.sendTransaction(tx);
  const address = await decodeCreateDaoTx(
    web3,
    contract.contractAbi,
    txReceipt
  );
  try {
    const res = await $.post(`${app.serverUrl()}/createChain`, {
      id: daoForm.name,
      base: ChainBase.Ethereum,
      chain_string: daoForm.chainString,
      eth_chain_id: ethChainId,
      jwt: app.user.jwt,
      token_name: daoForm.tokenName,
      type: ChainType.DAO,
      default_symbol: daoForm.symbol,
      address,
      icon_url: daoForm.iconUrl,
      node_url: daoForm.nodeUrl,
      alt_wallet_url: daoForm.altWalletUrl,
      ...daoForm,
    });
    const { admin_address, chain } = res.result;
    if (admin_address) {
      await linkExistingAddressToChainOrCommunity(
        res.result.admin_address,
        chain.id,
        chain.id
      );
    }
    await initAppState(false);
    // TODO: notify about needing to run event migration
    m.route.set(`/${res.result.chain?.id}`);
  } catch (err) {
    console.log('err', err);
    throw new Error(err);
  }
}
