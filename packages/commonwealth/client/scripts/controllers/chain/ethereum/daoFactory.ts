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
import { parseAbiItemsFromABI } from 'helpers/abi_utils';
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
      this.chain.init(nodeObj);
      this.web3Contract = new this.chain.api.eth.Contract(
        parseAbiItemsFromABI(this.contract.abi),
        this.contract.address
      );
    } catch (error) {
      console.error('Failed to create DaoFactory controller', error);
    }
  }
}
