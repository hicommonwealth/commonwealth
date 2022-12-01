import $ from 'jquery';
import m from 'mithril';
import app from 'state';
import { Contract, NodeInfo, IWebWallet } from 'models';
import { initAppState } from 'app';
import { TransactionConfig, TransactionReceipt } from 'web3-core/types';
import { parseAbiItemsFromABI, parseEventFromABI } from 'helpers/abi_utils';
import { AbiItem } from 'web3-utils';
import { ChainBase, ChainNetwork, ChainType } from 'common-common/src/types';
import { linkExistingAddressToChainOrCommunity } from 'controllers/app/login';
import {
  ChainFormFields,
  EthFormFields,
} from 'views/pages/create_community/types';
import Web3 from 'web3';
import { processAbiInputsToDataTypes } from 'helpers/abi_form_helpers';
import { decodeCuratedFactoryTx } from 'helpers/web3_tx_helpers';

type EthDaoFormFields = {
  network: ChainNetwork.Ethereum;
  tokenName: string;
};
type CreateFactoryEthDaoForm = ChainFormFields &
  EthFormFields &
  EthDaoFormFields;

export default class GeneralContractsController {
  public contract: Contract;
  public isFactory: boolean;

  constructor(contract: Contract) {
    this.isFactory = contract.isFactory;
    this.contract = contract;
  }

  public async makeContractCall(
    to: string,
    data: string,
    wallet: IWebWallet<any>
  ) {
    // encoding + decoding require ABI + happen inside contracts controller
    try {
      const web3: Web3 = wallet.api;
      const tx: TransactionConfig = { to, data };
      const txResult = await web3.givenProvider.request({
        method: 'eth_call',
        params: [tx, 'latest'],
      });
      return txResult;
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
    const web3: Web3 = wallet.api;
    const tx: TransactionConfig = {
      from: wallet.accounts[0],
      to,
      data,
    };
    return web3.eth.sendTransaction(tx);
  }

  public async callContractFunction(
    fn: AbiItem,
    formInputMap: Map<string, Map<number, string>>
  ): Promise<TransactionReceipt | string> {
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
    const web3: Web3 = signingWallet.api;

    const methodSignature = `${fn.name}(${fn.inputs
      .map((input) => input.type)
      .join(',')})`;

    let functionContract;
    try {
      functionContract = new web3.eth.Contract(
        parseAbiItemsFromABI(this.contract.abi),
        this.contract.address
      );
    } catch (error) {
      console.error('Failed to create DaoFactory controller', error);
    }

    const contract = this.contract;

    const functionTx = functionContract.methods[methodSignature](
      ...processedArgs
    );
    if (fn.stateMutability !== 'view' && fn.constant !== true) {
      // Sign Tx with PK if not view function
      const txReceipt: TransactionReceipt = await this.makeContractTx(
        contract.address,
        functionTx.encodeABI(),
        signingWallet
      );
      return txReceipt;
    } else {
      // send transaction
      const tx: string = await this.makeContractCall(
        contract.address,
        functionTx.encodeABI(),
        signingWallet
      );
      return tx;
    }
  }

  public async decodeTransactionData(fn: AbiItem, tx: any): Promise<any[]> {
    const sender = app.user.activeAccount;
    // get querying wallet
    const signingWallet = await app.wallets.locateWallet(
      sender,
      ChainBase.Ethereum
    );
    const web3: Web3 = signingWallet.api;
    // simple return type
    let result;
    if (fn.outputs.length === 1) {
      let decodedTx;
      decodedTx = decodeCuratedFactoryTx(web3, fn, tx);
      if (decodedTx == null) {
        decodedTx = web3.eth.abi.decodeParameter(fn.outputs[0].type, tx);
      }
      result = [];
      result.push(decodedTx);
    } else if (fn.outputs.length > 1) {
      const decodedTxMap = web3.eth.abi.decodeParameters(
        fn.outputs.map((output) => output.type),
        tx
      );
      // complex return type
      result = Array.from(Object.values(decodedTxMap));
    }
    return result;
  }

  public async createCuratedFactory(
    contract: Contract,
    web3: Web3,
    functionTx: any,
    wallet: IWebWallet<any>,
    daoForm: CreateFactoryEthDaoForm
  ) {
    if (contract.nickname === 'curated-factory-goerli') {
      const eventAbiItem = parseEventFromABI(contract.abi, 'ProjectCreated');
      // Sign Tx with PK if not view function
      const txReceipt = await this.makeContractTx(
        contract.address,
        functionTx.encodeABI(),
        wallet
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

  public async createFactoryDao(
    fn: AbiItem,
    processedArgs: any[],
    wallet: IWebWallet<any>,
    daoForm: CreateFactoryEthDaoForm
  ) {
    const web3: Web3 = wallet.api;
    let functionContract;
    try {
      functionContract = new web3.eth.Contract(
        parseAbiItemsFromABI(this.contract.abi),
        this.contract.address
      );
    } catch (error) {
      console.error('Failed to create DaoFactory controller', error);
    }

    const methodSignature = `${fn.name}(${fn.inputs
      .map((input) => input.type)
      .join(',')})`;

    const functionTx = functionContract.methods[methodSignature](
      ...processedArgs
    );

    const contract = this.contract;

    await this.createCuratedFactory(
      contract,
      web3,
      functionTx,
      wallet,
      daoForm
    );
  }
}
