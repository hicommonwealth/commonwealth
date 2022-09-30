import { ApiStatus, IApp } from 'state';
import Web3 from 'web3';
import m from 'mithril';
import moment from 'moment';

import { TransactionReceipt } from 'web3-core';

import {
  Contract,
  NodeInfo,
  ITXModalData,
  ITXData,
  IChainModule,
  ChainInfo,
  IWebWallet,
  IChainAdapter,
} from 'models';

import { Contract as Web3Contract } from 'web3-eth-contract';
import { parseAbiItemsFromABI, parseEventFromABI } from 'helpers/abi_utils';
import { AbiItem } from 'web3-utils';
import { ChainBase, ChainType } from 'common-common/src/types';
import { linkExistingAddressToChainOrCommunity } from 'controllers/app/login';
import EthereumChain from './chain';

export default class DaoFactoryController {
  public chain: EthereumChain;
  public contract: Contract;
  public web3Contract: Web3Contract;

  constructor(chain: EthereumChain, contract: Contract) {
    this.chain = chain;
    this.contract = contract;
    try {
      const nodeObj: NodeInfo = this.chain.app.config.nodes.getNodesByChainId(
        this.contract.chainNodeId
      );
      this.chain._initApi(nodeObj);
      this.web3Contract = new this.chain.api.eth.Contract(
        parseAbiItemsFromABI(this.contract.abi),
        this.contract.address
      );
    } catch (error) {
      console.error('Failed to create DaoFactory controller', error);
    }
  }

  public async createDao(
    fn: AbiItem,
    processedArgs: any[],
    wallet: IWebWallet<any>
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
        .makeContractTx(
          contract.address,
          functionTx.encodeABI(),
          wallet
        )
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
              chain_string: chainString,
              eth_chain_id: ethChainId,
              jwt: app.user.jwt,
              node_url: nodeUrl,
              token_name: tokenName,
              type: ChainType.DAO,
              default_symbol: symbol,
              ...this.state.form,
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
            notifyError(
              err.responseJSON?.error || 'Creating new ETH DAO community failed'
            );
          } finally {
            this.state.saving = false;
          }
        });
    }
  }
}
