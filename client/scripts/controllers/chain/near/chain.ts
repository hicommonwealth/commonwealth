import { IChainModule, ITXModalData, NodeInfo } from 'models';
import { NearToken } from 'adapters/chain/near/types';
import BN from 'bn.js';
import { ApiStatus, IApp } from 'state';
import { Near as NearApi, connect as nearConnect } from 'nearlib/lib/near';
import { BrowserLocalStorageKeyStore } from 'nearlib/lib/key_stores';
import moment from 'moment-twitter';
import * as m from 'mithril';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { NodeStatusResult } from 'nearlib/lib/providers/provider';
import { NearAccount } from './account';

class NearChain implements IChainModule<NearToken, NearAccount> {
  public hasWebWallet(): boolean {
    return true;
  }

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
  private _nodeStatus: Subject<NodeStatusResult> = new Subject();
  public get nodeStatus$(): Observable<NodeStatusResult> {
    return this._nodeStatus.asObservable();
  }

  private _app: IApp;
  public get app() { return this._app; }

  constructor(app: IApp) {
    this._app = app;
  }

  public async init(node: NodeInfo, reset = false) {
    this._config = {
      networkId: node.chain.id === 'near-local' ? 'local' : 'default',
      nodeUrl: node.url,
      walletUrl: 'https://wallet.nearprotocol.com', // TODO: alternatives?
      deps: {
        keyStore: new BrowserLocalStorageKeyStore(),
      },
    };

    this._api = await nearConnect(this.config);

    // block times seem about 1.5-2.5 seconds, so querying every 2s feels right
    this._syncHandle = setInterval(async () => {
      try {
        const nodeStatus = await this._api.connection.provider.status();

        // maintain observable so Accounts can access the status without a separate query
        this._nodeStatus.next(nodeStatus);

        // handle chain-related updates
        this._chainId = nodeStatus.chain_id;
        const { latest_block_time, latest_block_height } = nodeStatus.sync_info;

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
    }, 2000);
  }

  public async deinit(): Promise<void> {
    clearInterval(this._syncHandle);
    this._nodeStatus.complete();
    this.app.chain.networkStatus = ApiStatus.Disconnected;
  }

  public createTXModalData(
    author: NearAccount,
    txFunc,
    txName: string,
    objName: string,
    cb?: (success: boolean) => void
  ): ITXModalData {
    // TODO
    throw new Error('Txs not yet implemented');
  }
}

export default NearChain;
