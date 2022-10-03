import $ from 'jquery';
import m from 'mithril';

import { Contract, NodeInfo, IWebWallet } from 'models';

import { Contract as Web3Contract } from 'web3-eth-contract';
import { parseAbiItemsFromABI, parseEventFromABI } from 'helpers/abi_utils';
import { AbiItem } from 'web3-utils';
import { ChainBase, ChainNetwork, ChainType } from 'common-common/src/types';
import { linkExistingAddressToChainOrCommunity } from 'controllers/app/login';
import {
  ChainFormFields,
  EthFormFields,
} from 'views/pages/create_community/types';
import EthereumChain from './chain';

type EthDaoFormFields = {
  network: ChainNetwork.Ethereum;
  tokenName: string;
};
type CreateFactoryEthDaoForm = ChainFormFields &
  EthFormFields &
  EthDaoFormFields;

export default class GeneralContractsController {
  public chain: EthereumChain;
  public contract: Contract;
  public web3Contract: Web3Contract;
  public isFactory: boolean;

  constructor(chain: EthereumChain, contract: Contract) {
    this.isFactory = contract.isFactory;
    this.chain = chain;
    this.contract = contract;
    try {
      let nodeObj: NodeInfo;
      if (this.chain.app.chain.meta.node) {
        nodeObj = this.chain.app.chain.meta.node;
      } else {
        nodeObj = this.chain.app.config.nodes.getNodesByChainId(
          this.contract.chainNodeId
        );
      }
      this.chain._initApi(nodeObj);
      this.web3Contract = new this.chain.api.eth.Contract(
        parseAbiItemsFromABI(this.contract.abi),
        this.contract.address
      );
    } catch (error) {
      console.error('Failed to create DaoFactory controller', error);
    }
  }

  public async callContractFunction(
    fn: AbiItem,
    processedArgs: any[],
    wallet: IWebWallet<any>
  ) {
    const methodSignature = `${fn.name}(${fn.inputs
      .map((input) => input.type)
      .join(',')})`;

    const functionContract = this.web3Contract;
    const chain = this.chain;
    const contract = this.contract;

    const functionTx = functionContract.methods[methodSignature](
      ...processedArgs
    );
    let tx;
    if (fn.stateMutability !== 'view' && fn.constant !== true) {
      // Sign Tx with PK if not view function
      chain
        .makeContractTx(contract.address, functionTx.encodeABI(), wallet)
        .then(async (txReceipt) => {
          console.log('txReceipt', txReceipt);
          tx = txReceipt;
        });
    } else {
      // send transaction
      tx = await chain.makeContractCall(
        contract.address,
        functionTx.encodeABI(),
        wallet
      );
    }
    return tx;
  }

  public decodeTransactionData(fn: AbiItem, tx: string): any {
    // simple return type
    let result;
    if (fn.outputs.length === 1) {
      const decodedTx = this.chain.api.eth.abi.decodeParameter(
        fn.outputs[0].type,
        tx
      );
      result = [];
      result.push(decodedTx);
    } else if (fn.outputs.length > 1) {
      const decodedTxMap = this.chain.api.eth.abi.decodeParameters(
        fn.outputs.map((output) => output.type),
        tx
      );
      // complex return type
      result = Array.from(Object.values(decodedTxMap));
    }
    return result;
  }

  public async createFactoryDao(
    fn: AbiItem,
    processedArgs: any[],
    wallet: IWebWallet<any>,
    daoForm: CreateFactoryEthDaoForm
  ): Promise<any> {
    const functionContract = this.web3Contract;

    const methodSignature = `${fn.name}(${fn.inputs
      .map((input) => input.type)
      .join(',')})`;

    const functionTx = functionContract.methods[methodSignature](
      ...processedArgs
    );

    const chain = this.chain;
    const contract = this.contract;
    const app = this.chain.app;

    if (contract.nickname === 'curated-factory-goerli') {
      const eventAbiItem = parseEventFromABI(contract.abi, 'ProjectCreated');
      // Sign Tx with PK if not view function
      chain
        .makeContractTx(contract.address, functionTx.encodeABI(), wallet)
        .then(async (txReceipt) => {
          console.log('txReceipt', txReceipt);
          const decodedLog = chain.api.eth.abi.decodeLog(
            eventAbiItem.inputs,
            txReceipt.logs[0].data,
            txReceipt.logs[0].topics
          );
          console.log('decodedLog', decodedLog);
          console.log('state.form.address', decodedLog.projectAddress);
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
            // TODO: notify about needing to run event migration
            m.route.set(`/${res.result.chain?.id}`);
          } catch (err) {
            throw new Error(err);
          }
        });
    }
  }
}
