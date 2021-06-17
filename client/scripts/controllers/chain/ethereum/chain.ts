import { ApiStatus, IApp } from 'state';
import Web3 from 'web3';
import m from 'mithril';
import moment from 'moment';

import {
  NodeInfo,
  ITXModalData,
  ITXData,
  IChainModule
} from 'models';
import { EthereumCoin } from 'adapters/chain/ethereum/types';
import EthereumAccount from './account';

export const INFURA_ID = process.env.INFURA_ID || 'b19b8175e688448ead43a0ab5f03438a';

export interface IEthereumTXData extends ITXData {
  chainId: string;
  accountNumber: number;
  sequence: number;

  // skip simulating the tx twice by saving the original estimated gas
  gas: number;
}

class EthereumChain implements IChainModule<EthereumCoin, EthereumAccount> {
  public createTXModalData(author: EthereumAccount, txFunc: any, txName: string, objName: string): ITXModalData {
    throw new Error('Method not implemented.');
  }

  private static _instance;
  public static get(): EthereumChain {
    if (!this._instance) {
      // TODO: Figure out how to inject the app since this method is static
      this._instance = new EthereumChain(null);
    }
    return this._instance;
  }

  public get denom() {
    return 'ETH';
  }

  private _app: IApp;
  public get app() { return this._app; }

  constructor(app: IApp) {
    this._app = app;
  }

  public coins(n: number, inDollars?: boolean) {
    return new EthereumCoin('ETH', n, inDollars);
  }

  private _api: Web3;
  private _eventHandlers = {};
  private _metadataInitialized: boolean = false;
  private _totalbalance: EthereumCoin;
  public get metadataInitialized() { return this._metadataInitialized; }
  public get totalbalance() { return this._totalbalance; }

  public async initApi(node?: NodeInfo): Promise<any> {
    if (node.url.includes('infura')) {
      const infuraId = INFURA_ID;
      const networkPrefix = node.url.split('infura')[0];
      const url = `${networkPrefix}infura.io/ws/v3/${infuraId}`;
      try {
        const provider = new Web3.providers.WebsocketProvider(url);
        this._api = new Web3(provider);
      } catch (error) {
        console.log('Could not connect to Ethereum using infura');
        this.app.chain.networkStatus = ApiStatus.Disconnected;
        throw error;
      }
    } else {
      // support local/etc
      try {
        // TODO: support http?
        const provider = new Web3.providers.WebsocketProvider(node.url);
        this._api = new Web3(provider);
      } catch (error) {
        console.log(`Could not connect to Ethereum on ${node.url}`);
        this.app.chain.networkStatus = ApiStatus.Disconnected;
        throw error;
      }
    }

    const isListening = await this._api.eth.net.isListening();
    // TODO: what should we do with the result?

    this.app.chain.networkStatus = ApiStatus.Connected;
    this._api.eth.getBlock('latest').then((headers) => {
      if (this.app.chain) {
        this.app.chain.block.height = headers.number;
        this.app.chain.block.lastTime = moment.unix(+headers.timestamp);
        m.redraw();
      }
    });
    this._api.eth.subscribe('newBlockHeaders', (err, headers) => {
      if (this.app.chain) {
        this.app.chain.block.height = headers.number;
        this.app.chain.block.lastTime = moment.unix(+headers.timestamp);
        m.redraw();
      }
    });
    return this._api;
  }

  public async resetApi(selectedNode: NodeInfo) {
    await this.initApi(selectedNode);
    return this._api;
  }

  public async deinitApi() {
    // TODO: deinit the API, if necessary
    // ...
    if (this._api) {
      // https://web3js.readthedocs.io/en/v1.2.0/web3-net.html
      const isListening = await this._api.eth.net.isListening();
      if (isListening && (this.api.currentProvider as any).connection !== undefined) {
        await (this._api.currentProvider as any).connection.close();
      }
      this._api = null;
    }
  }

  public get api(): Web3 {
    if (!this._api) {
      throw new Error('Must initialize API before using.');
    }
    return this._api;
  }

  // Loads chain metadata such as issuance and block period
  public async initMetadata(): Promise<void> {
    this._metadataInitialized = true;
  }

  public deinitMetadata() {
    // TODO: deinit metadata, if necessary
    // ...
    this._metadataInitialized = false;
  }

  public initEventLoop() {
    if (!this._api) throw new Error('Ethereum Web3 API uninitialized');
    // Demonstrate adding an event handler
    this.addEventHandler(
      'newBlockHeaders',
      (data) => data,
      (err) => { throw new Error(`EthereumChain.eventHandlers.newBlockHeaders err ${err}`); },
    );
  }

  public deinitEventLoop() {
    if (this._api) {
      console.log('deinitEventLoop');
      console.log(this._eventHandlers);

      for (const event of Object.keys(this._eventHandlers)) {
        if (this._eventHandlers[event]) {
          this.removeEventHandler(this._eventHandlers[event]);
        }
      }
    }
  }

  public addEventHandler(eventName: string, onData: (data: any) => void, onErr: (err: any) => void): number {
    console.log('EthereumChain.addEventHandler', eventName);

    // Map event name to Web3 EventEmitter object
    this._eventHandlers[eventName] = this._api.eth.subscribe(eventName as any, (err, res) => {
      if (!err) return;
      console.error(err);
    });

    this._eventHandlers[eventName].on('data', onData);
    this._eventHandlers[eventName].on('error', onErr);

    return this._eventHandlers[eventName];
  }

  public removeEventHandler(eventName: string): boolean {
    console.log('EthereumChain.removeEventHandler', eventName);

    if (!this._eventHandlers[eventName]) {
      return false;
    }
    // Unsubscribe the Web3 EventEmiteter obj and remove from handler map
    (this._eventHandlers[eventName]).unsubscribe((err, success) => {
      if (err) {
        console.log('Unsubscribe err for', eventName, err);
      } else {
        console.log('Successfully unsubscribed from', eventName);
      }
      // TODO: maybe have removeEventHandler return Promise<Boolean>
    });
    delete this._eventHandlers[eventName];
    return true;
  }

  public isHandler(eventName: string, id: number): boolean {
    return this._eventHandlers[eventName];
  }

  public async sendTransactionWrapper(transactionObject, callback) {
    if (!this._api) throw new Error('Ethereum Web3 API uninitialized');

    console.log('EthereumChain.sendTransaction', transactionObject);

    this._api.eth.sendTransaction(transactionObject, (err, result) => {
      if (err) {
        throw new Error(`Error in EthereumChain.sendTransaction ${err}`);
      }
      console.log('EthereumChain.sendTransaction result', result);

      callback(err, result);
    });
  }
}

export default EthereumChain;
