import { ApiStatus, IApp } from 'state';

// Note: due to strange issues with Web3, we can't seem to use the
// `Web3` class type, so it's marked in comments below

import {
  NodeInfo,
  ITXModalData,
  ITXData,
  IChainModule
} from 'models';
import { EthereumCoin } from 'adapters/chain/ethereum/types';
import { EthereumAccount } from './account';

export interface IEthereumTXData extends ITXData {
  chainId: string;
  accountNumber: number;
  sequence: number;

  // skip simulating the tx twice by saving the original estimated gas
  gas: number;
}

class EthereumChain implements IChainModule<EthereumCoin, EthereumAccount> {
  public hasWebWallet(): boolean {
    return true;
  }
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

  private _api: any /* Web3 */;
  private _eventHandlers = {};
  private _metadataInitialized: boolean = false;
  private _totalbalance: EthereumCoin;
  public get metadataInitialized() { return this._metadataInitialized; }
  public get totalbalance() { return this._totalbalance; }

  public initApi(node?: NodeInfo): Promise<any> {
    return new Promise(async (resolve, reject) => {
      // TODO: check for ethereum-local should probably be elsewhere
      // TODO: for dapp browsers, we should fall back to infura if connecting via the JS window object fails
      const Web3 = (await import('web3')).default;
      if (node.chain.id === 'ethereum-local') {
        // Local node
        try {
          const localProvider = new Web3.providers.WebsocketProvider(node.url);
          this._api = new Web3(localProvider);
        } catch (error) {
          console.log('Could not connect to Ethereum using local node');
          this.app.chain.networkStatus = ApiStatus.Disconnected;
          return reject(error);
        }
      } else if ((window as any).ethereum) {
        // Dapp browsers
        try {
          console.log('Connecting to Ethereum via Metamask');
          this._api = new Web3((window as any).ethereum);
        } catch (error) {
          console.log('Could not connect to Ethereum using injected web3');
          this.app.chain.networkStatus = ApiStatus.Disconnected;
          return reject(error);
        }
      } else if ((window as any).web3) {
        // Legacy dapp browsers
        try {
          console.log('Connecting to Ethereum via legacy web3 object');
          this._api = new Web3((window as any).web3.currentProvider);
        } catch (error) {
          console.log('Could not connect to Ethereum using injected web3');
          this.app.chain.networkStatus = ApiStatus.Disconnected;
          return reject(error);
        }
      } else {
        // Non-dapp browsers, use Infura -> https://infura.io/docs/ethereum/wss/introduction
        try {
          const provider = new Web3.providers.WebsocketProvider(node.url);
          this._api = new Web3(provider);
        } catch (error) {
          console.log('Could not connect to Ethereum using remote node');
          this.app.chain.networkStatus = ApiStatus.Disconnected;
          return reject(error);
        }
      }
      const isListening = await this._api.eth.net.isListening();
      if (isListening) {
        this.app.chain.networkStatus = ApiStatus.Connected;
        resolve(this._api);
      } else {
        return reject(this._api);
      }
    });
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
      if (isListening && this.api.currentProvider.connection !== undefined ) {
        await this._api.currentProvider.connection.close();
      }
      return this._api = null;
    }
  }

  // TODO: return type?
  public get api(): any /* Web3 */ {
    if (!this._api) {
      throw new Error('Must initialize API before using.');
    }
    return this._api;
  }

  // Loads chain metadata such as issuance and block period
  public initMetadata(): Promise<void> {

    return new Promise(async (resolve, reject) => {
      this._metadataInitialized = true;
      resolve();
    });
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
      (err) => { throw new Error('EthereumChain.eventHandlers.newBlockHeaders err' + err ); },
    );
  }

  public deinitEventLoop() {
    if (this._api) {
      console.log('deinitEventLoop');
      console.log(this._eventHandlers);

      for (const event in this._eventHandlers) {
        if (this._eventHandlers[event]) {
          this.removeEventHandler(this._eventHandlers[event]);
        }
      }
    }
  }

  public addEventHandler(eventName: string, onData: (data: any) => void, onErr: (err: any) => void): number {
    console.log('EthereumChain.addEventHandler', eventName);

    // Map event name to Web3 EventEmitter object
    this._eventHandlers[eventName] = this._api.eth.subscribe(eventName, (err, res) => {
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
    delete this._eventHandlers[eventName] ;
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
        throw new Error('Error in EthereumChain.sendTransaction' + err);
      }
      console.log('EthereumChain.sendTransaction result', result);

      callback(err, result);
    });
  }
}

export default EthereumChain;
