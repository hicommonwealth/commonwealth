/* eslint-disable @typescript-eslint/no-unused-vars */

import { EthereumCoin } from 'adapters/chain/ethereum/types';

import { ChainNode, ExtendedCommunity } from '@hicommonwealth/schemas';
import moment from 'moment';
import type { IApp } from 'state';
import { ApiStatus } from 'state';
import Web3, { Web3BaseProvider } from 'web3';
import { z } from 'zod';
import type { IChainModule, ITXModalData } from '../../../models/interfaces';
import type EthereumAccount from './account';

const ETHEREUM_BLOCK_TIME = 13;

class EthereumChain implements IChainModule<EthereumCoin, EthereumAccount> {
  public createTXModalData(
    author: EthereumAccount,
    txFunc: any,
    txName: string,
    objName: string,
  ): ITXModalData {
    throw new Error('Method not implemented.');
  }

  private static _instance;

  public static get(): EthereumChain {
    if (!this._instance) {
      // TODO: Figure out how to inject the app since this method is static
      // @ts-expect-error StrictNullChecks
      this._instance = new EthereumChain(null);
    }
    return this._instance;
  }

  public get denom() {
    return 'ETH';
  }

  private _app: IApp;
  public get app() {
    return this._app;
  }

  constructor(app: IApp) {
    this._app = app;
  }

  public coins(n: number, inDollars?: boolean) {
    return new EthereumCoin('ETH', n, inDollars);
  }

  private _api: Web3;
  private _metadataInitialized = false;

  public _initApi(node: z.infer<typeof ChainNode>): Web3 {
    try {
      const provider =
        node.url.slice(0, 4) == 'http'
          ? new Web3.providers.HttpProvider(node.url)
          : new Web3.providers.WebsocketProvider(node.url);

      this._api = new Web3(provider);
      return this._api;
    } catch (error) {
      console.log(`Could not connect to Ethereum on ${node.url}`);
      this.app.chain.networkStatus = ApiStatus.Disconnected;
      throw error;
    }
  }

  public async initApi(node?: z.infer<typeof ChainNode>): Promise<Web3> {
    this.app.chain.block.duration = ETHEREUM_BLOCK_TIME;
    node && this._initApi(node);
    this.app.chain.networkStatus = ApiStatus.Connected;
    console.log('getting block #');
    const blockNumber = Number(await this._api.eth.getBlockNumber());
    console.log(blockNumber);
    const headers = await this._api.eth.getBlock(`${blockNumber}`);
    if (
      this.app.chain &&
      this.app.chain.meta.ChainNode &&
      this.app.chain.meta.ChainNode.eth_chain_id !== 1
    ) {
      this.app.chain.block.height = Number(headers.number);
      this.app.chain.block.lastTime = moment.unix(Number(headers.timestamp));

      // TODO: @Timothee - delete all this and the dependencies on app.chain.block.duration
      // compute the average block time
      // TODO: cache the average blocktime on server rather than computing it here every time
      const nHeadersForBlocktime = 5;
      let totalDuration = 0;
      let lastBlockTime = Number(headers.timestamp);
      for (let n = 0; n < nHeadersForBlocktime; n++) {
        const prevBlockNumber = blockNumber - 1 - n;
        if (prevBlockNumber > 0) {
          const prevHeader = await this._api.eth.getBlock(
            `${blockNumber - 1 - n}`,
          );
          const duration = lastBlockTime - Number(prevHeader.timestamp);
          lastBlockTime = Number(prevHeader.timestamp);
          totalDuration += duration;
        } else {
          break;
        }
      }
      this.app.chain.block.duration = totalDuration / nHeadersForBlocktime;
      console.log(`Computed block duration: ${this.app.chain.block.duration}`);
    }
    return this._api;
  }

  public async resetApi(selectedChain: z.infer<typeof ExtendedCommunity>) {
    await this.initApi(selectedChain.ChainNode as z.infer<typeof ChainNode>);
    return this._api;
  }

  public async deinitApi() {
    // TODO: deinit the API, if necessary
    // ...
    if (this._api) {
      if ((this.api.currentProvider as any)?.connection.connected) {
        await (this._api.currentProvider as any).connection.close();
      }
      // @ts-expect-error StrictNullChecks
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
  }

  public deinitEventLoop() {
    if (
      this._api?.givenProvider &&
      this._api.currentProvider instanceof Web3.providers.WebsocketProvider
    ) {
      if (this._api.givenProvider instanceof Web3BaseProvider) {
        this._api.givenProvider.disconnect(1000, 'finished');
      }
    }
  }
}

export default EthereumChain;
