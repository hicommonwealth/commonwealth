import { IChainModule, ITXModalData, NodeInfo } from 'models';
import { NearToken } from 'adapters/chain/near/types';
import BN from 'bn.js';
import { ApiStatus, IApp } from 'state';
import { Near as NearApi, connect as nearConnect, keyStores } from 'near-api-js';
import { NodeStatusResult } from 'near-api-js/lib/providers/provider';
import moment from 'moment';
import * as m from 'mithril';
import { NearAccounts, NearAccount } from './account';

class NearChain implements IChainModule<NearToken, NearAccount> {
  private _api: NearApi;
  public get api(): NearApi {
    return this._api;
  }

  public get denom() { return this.app.chain.currency; }
  public coins(n: number | string | BN, inDollars?: boolean) {
    return new NearToken(n, inDollars);
  }

  private _config: any;
  public get config() { return this._config; }

  private _chainId: string;
  public get chainId() { return this._chainId; }

  private _syncHandle;
  private _nodeStatus: NodeStatusResult;
  public get nodeStatus(): NodeStatusResult {
    return this._nodeStatus;
  }

  private _app: IApp;
  public get app() { return this._app; }

  constructor(app: IApp) {
    this._app = app;
  }

  public async init(node: NodeInfo, accounts: NearAccounts, reset = false) {
    this._config = {
      networkId: node.chain.id === 'near-testnet' ? 'testnet' : 'mainnet',
      nodeUrl: node.url,
      walletUrl: node.chain.id === 'near-testnet' ? 'https://wallet.testnet.near.org/' : 'https://wallet.near.org/',
      keyStore: accounts.keyStore,
    };

    this._api = await nearConnect(this.config);

    // block times seem about 1.5-2.5 seconds, so querying every 2s feels right
    const syncFn = async () => {
      try {
        this._nodeStatus = await this._api.connection.provider.status();

        // handle chain-related updates
        this._chainId = this._nodeStatus.chain_id;
        const { latest_block_time, latest_block_height } = this._nodeStatus.sync_info;

        // update block heights and times
        const lastTime: moment.Moment = this.app.chain.block && this.app.chain.block.lastTime;
        const lastHeight = this.app.chain.block && this.app.chain.block.height;
        this.app.chain.block.lastTime = moment(latest_block_time);
        this.app.chain.block.height = latest_block_height;
        if (lastTime && lastHeight) {
          const duration = this.app.chain.block.lastTime.diff(lastTime, 'ms') / 1000;
          const nBlocks = this.app.chain.block.height - lastHeight;
          if (nBlocks > 0 && duration > 0) {
            // if we accidentally miss multiple blocks, use the average block time across all of them
            this.app.chain.block.duration = duration / nBlocks;
          }
        }
        if (this.app.chain.networkStatus !== ApiStatus.Connected) {
          this.app.chain.networkStatus = ApiStatus.Connected;
          m.redraw();
        }
      } catch (e) {
        if (this.app.chain.networkStatus !== ApiStatus.Disconnected) {
          console.error(`failed to query NEAR status: ${JSON.stringify(e)}`);
          this.app.chain.networkStatus = ApiStatus.Disconnected;
          m.redraw();
        }
      }
    };
    await syncFn();
    // this._syncHandle = setInterval(syncFn, 2000);
  }

  public async deinit(): Promise<void> {
    clearInterval(this._syncHandle);
    this.app.chain.networkStatus = ApiStatus.Disconnected;
  }

  public createTXModalData(
    author: NearAccount,
    txFunc,
    txName: string,
    objName: string,
    cb?: (success: boolean) => void,
  ): ITXModalData {
    // TODO
    throw new Error('Txs not yet implemented');
  }
}

export default NearChain;
