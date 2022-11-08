import $ from 'jquery';
import m from 'mithril';
import app from 'state';
import { Contract, NodeInfo, IWebWallet } from 'models';
import { initAppState } from 'app';
import { Contract as Web3Contract } from 'web3-eth-contract';
import { RLPEncodedTransaction, TransactionConfig, TransactionReceipt } from 'web3-core/types';
import { parseAbiItemsFromABI, parseEventFromABI } from 'helpers/abi_utils';
import { AbiItem } from 'web3-utils';
import { ChainBase, ChainNetwork, ChainType } from 'common-common/src/types';
import { linkExistingAddressToChainOrCommunity } from 'controllers/app/login';
import {
  ChainFormFields,
  EthFormFields,
} from 'views/pages/create_community/types';
import Web3 from 'web3';

type EthDaoFormFields = {
  network: ChainNetwork.Ethereum;
  tokenName: string;
};
type CreateFactoryEthDaoForm = ChainFormFields &
  EthFormFields &
  EthDaoFormFields;

export default class GeneralContractsController {
  public web3: Web3;
  public contract: Contract;
  public web3Contract: Web3Contract;
  public isFactory: boolean;

  constructor(web3: Web3, contract: Contract) {
    this.isFactory = contract.isFactory;
    this.web3 = web3;
    this.contract = contract;
    try {
      this.web3Contract = new this.web3.eth.Contract(
        parseAbiItemsFromABI(this.contract.abi),
        this.contract.address
      );
    } catch (error) {
      console.error('Failed to create DaoFactory controller', error);
    }
  }

  private async contractCall(web3: Web3, tx: TransactionConfig): Promise<string> {
    const txResult = await web3.givenProvider.request({
      method: 'eth_call',
      params: [tx, 'latest'],
    });
    return txResult;
  }

  private async sendTransaction(
    web3: Web3,
    tx: TransactionConfig
  ): Promise<TransactionReceipt> {
    return web3.eth.sendTransaction(tx);
  }

  public async makeContractCall(
    to: string,
    data: string,
    wallet: IWebWallet<any>
  ) {
    // encoding + decoding require ABI + happen inside contracts controller
    try {
      const result = await this.contractCall(wallet.api, { to, data });
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  /*
  Writing to contract data, aka creating transaction
  */
  public makeContractTx(
    to: string,
    data: string,
    wallet: IWebWallet<any>
  ): Promise<TransactionReceipt> {
    // Not using contractApi because it's ethers-dependent
    // Non hardhat, non ethers Web3 Lib solution for signing and submitting tx
    return this.sendTransaction(wallet.api, {
      from: wallet.accounts[0],
      to,
      data,
    });
  }

  public async callContractFunction(
    fn: AbiItem,
    processedArgs: any[],
    wallet: IWebWallet<any>
  ): Promise<TransactionReceipt | string> {
    const methodSignature = `${fn.name}(${fn.inputs
      .map((input) => input.type)
      .join(',')})`;

    const functionContract = this.web3Contract;
    const contract = this.contract;

    const functionTx = functionContract.methods[methodSignature](
      ...processedArgs
    );
    if (fn.stateMutability !== 'view' && fn.constant !== true) {
      // Sign Tx with PK if not view function
      const txReceipt: TransactionReceipt = await this.makeContractTx(
        contract.address,
        functionTx.encodeABI(),
        wallet
      );
      return txReceipt;
    } else {
      // send transaction
      const tx: string = await this.makeContractCall(
        contract.address,
        functionTx.encodeABI(),
        wallet
      );
      return tx;
    }
  }

  public decodeTransactionData(fn: AbiItem, tx: any): any[] {
    // simple return type
    let result;
    if (fn.outputs.length === 1) {
      let decodedTx;
      if (
        this.contract.nickname === 'curated-factory-goerli' &&
        fn.name === 'createProject'
      ) {
        const eventAbiItem = parseEventFromABI(
          this.contract.abi,
          'ProjectCreated'
        );
        const decodedLog = this.web3.eth.abi.decodeLog(
          eventAbiItem.inputs,
          tx.logs[0].data,
          tx.logs[0].topics
        );
        console.log('decodedLog', decodedLog);
        decodedTx = decodedLog.projectAddress;
      } else {
        decodedTx = this.web3.eth.abi.decodeParameter(
          fn.outputs[0].type,
          tx
        );
      }
      result = [];
      result.push(decodedTx);
    } else if (fn.outputs.length > 1) {
      const decodedTxMap = this.web3.eth.abi.decodeParameters(
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
  ) {
    const functionContract = this.web3Contract;

    const methodSignature = `${fn.name}(${fn.inputs
      .map((input) => input.type)
      .join(',')})`;

    const functionTx = functionContract.methods[methodSignature](
      ...processedArgs
    );

    const contract = this.contract;

    if (contract.nickname === 'curated-factory-goerli') {
      const eventAbiItem = parseEventFromABI(contract.abi, 'ProjectCreated');
      // Sign Tx with PK if not view function
      const txReceipt = await this.makeContractTx(
        contract.address,
        functionTx.encodeABI(),
        wallet
      );
      console.log('txReceipt', txReceipt);
      const decodedLog = this.web3.eth.abi.decodeLog(
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
        await initAppState(false);
        // TODO: notify about needing to run event migration
        m.route.set(`/${res.result.chain?.id}`);
      } catch (err) {
        throw new Error(err);
      }
    }
  }
}
