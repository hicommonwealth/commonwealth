import type * as solw3 from '@solana/web3.js';
import BN from 'bn.js';

import moment from 'moment';
import type { IApp } from 'state';
import { ApiStatus } from 'state';
import type ChainInfo from '../../../models/ChainInfo';
import type { IChainModule, ITXModalData } from '../../../models/interfaces';
import type SolanaAccount from './account';

import { SolanaToken } from './types';

export default class SolanaChain
  implements IChainModule<SolanaToken, SolanaAccount>
{
  private _denom: string;
  public get denom(): string {
    return this._denom;
  }

  private _decimals: BN;

  private _app: IApp;
  public get app() {
    return this._app;
  }

  private _connection: solw3.Connection;
  public get connection() {
    return this._connection;
  }

  constructor(app: IApp) {
    this._app = app;
  }

  public async init(chain: ChainInfo, reset = false) {
    // default to 9 decimals
    this._decimals = new BN(10).pow(new BN(chain.decimals || 9));
    this._denom = chain.default_symbol;

    let url: string;

    const solw3 = await import('@solana/web3.js');
    try {
      url = solw3.clusterApiUrl(chain.node.url as solw3.Cluster);
    } catch (e) {
      url = chain.node.url;
      // TODO: test if custom url is valid
    }
    // TODO: validate config here -- maybe we want ws?
    this._connection = new solw3.Connection(url, 'confirmed');

    // slots are approx equal to block heights
    this.app.chain.block.height = await this._connection.getSlot();
    this.app.chain.block.duration = await this._connection.getBlockTime(
      this.app.chain.block.height
    );
    this.app.chain.block.lastTime = moment(); // approx hack to get current slot timestamp
    this.app.chain.networkStatus = ApiStatus.Connected;
  }

  public async deinit() {
    this.app.chain.networkStatus = ApiStatus.Disconnected;
    // no need to unsubscribe as it's HTTP RPC
    this._connection = null;
  }

  public coins(n: number | BN, inDollars?: boolean) {
    return new SolanaToken(this.denom, n, inDollars, this._decimals);
  }

  public createTXModalData(
    author: SolanaAccount,
    txFunc,
    txName: string,
    objName: string,
    cb?: (success: boolean) => void
  ): ITXModalData {
    throw new Error('unsupported');
  }
}
