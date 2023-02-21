import $ from 'jquery';
import m from 'mithril';
import type Web3 from 'web3';
import type { Contract, IWebWallet } from 'models';
import app, { initAppState } from 'state';
import { ChainBase, ChainType } from 'common-common/src/types';
import { linkExistingAddressToChainOrCommunity } from 'controllers/app/login';
import type { AbiItem } from 'web3-utils';
import type { TransactionReceipt } from 'web3-core';
import { parseEventFromABI } from '../../../shared/abi_utils';
import type { CreateFactoryEthDaoForm } from '../views/pages/create_community/types';
import { processAbiInputsToDataTypes } from './abi_form_helpers';
import { sendFunctionCall } from '../controllers/chain/ethereum/callContractFunction';
import { ethers } from 'ethers';

export function decodeTxParameterFromEvent(
  web3: Web3,
  abi: Record<string, unknown>[],
  tx: any,
  event_name: string,
  event_parameter: string
): string | null {
  const eventAbiItem = parseEventFromABI(abi, event_name);
  const decodedLog = web3.eth.abi.decodeLog(
    eventAbiItem.inputs,
    tx.logs[0].data,
    tx.logs[0].topics
  );
  return decodedLog[event_parameter];
}

export async function createCuratedProjectDao(
  contract: Contract,
  fn: AbiItem,
  formInputs: string[],
  daoForm: CreateFactoryEthDaoForm
) {
  const signingWallet: IWebWallet<any> =
    await app.wallets.getFirstAvailableMetamaskWallet();

  const ethChainId = contract.ethChainId;

  signingWallet.enableForEthChainId(ethChainId);

  if (!signingWallet.api) {
    throw new Error('Web3 Api Not Initialized');
  }
  const web3: Web3 = signingWallet.api;

  if (formInputs.length === 0) {
    throw new Error('Must Insert Inputs');
  }
  // handle processing the forms inputs into their proper data types
  const processedArgs = processAbiInputsToDataTypes(fn.inputs, formInputs);

  const ethersInterface = new ethers.utils.Interface(contract.abi);
  const functionTx = ethersInterface.encodeFunctionData(fn.name, processedArgs);

  const txReceipt: TransactionReceipt | any = await sendFunctionCall(
    fn,
    signingWallet,
    contract,
    functionTx,
    web3
  );

  const contractAbiObject = contract.contractAbi;
  const address = decodeTxParameterFromEvent(
    web3,
    contractAbiObject.abi,
    txReceipt,
    contractAbiObject.create_dao_event_name,
    contractAbiObject.create_dao_event_parameter
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
