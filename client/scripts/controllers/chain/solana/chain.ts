import { ITXModalData, NodeInfo, IChainModule } from 'models';
import { ApiStatus, IApp } from 'state';
import moment from 'moment';
import m from 'mithril';
import BN from 'bn.js';
import * as solw3 from '@solana/web3.js';

import { SolanaToken } from './types';
import SolanaAccount from './account';

export default class SolanaChain implements IChainModule<SolanaToken, SolanaAccount> {
  private _denom: string;
  public get denom(): string {
    return this._denom;
  }

  private _decimals: BN;

  private _app: IApp;
  public get app() { return this._app; }

  private _connection: solw3.Connection;
  public get connection() { return this._connection; }
  private _blockSubscription: NodeJS.Timeout;

  constructor(app: IApp) {
    this._app = app;
  }

  public async init(node: NodeInfo, reset = false) {
    // default to 9 decimals
    this._decimals = new BN(10).pow(new BN(node.chain.decimals || 9));
    this._denom = node.chain.symbol;

    let url: string;
    try {
      url = solw3.clusterApiUrl(node.url as solw3.Cluster);
    } catch (e) {
      url = node.url;
      // TODO: test if custom url is valid
    }
    // TODO: validate config here -- maybe we want ws?
    this._connection = new solw3.Connection(url, 'confirmed');

    const SLOT_UPDATE_INTERVAL = 6000;
    const updateSlot = async () => {
      // slots are approx equal to block heights
      const slot = await this._connection.getSlot();
      const prevSlot = this.app.chain.block.height;
      this.app.chain.block.height = slot;
      if (prevSlot) {
        // compute approx duration based on # of slots elapsed in update interval
        const nSlotsElapsed = slot - prevSlot;
        const msPerSlot = SLOT_UPDATE_INTERVAL / nSlotsElapsed;
        this.app.chain.block.duration = msPerSlot / 1000;
      }
      m.redraw();
    }

    if (this.app.chain.networkStatus === ApiStatus.Disconnected) {
      this.app.chain.networkStatus = ApiStatus.Connecting;
    }

    // load current slot
    await updateSlot();
    this.app.chain.networkStatus = ApiStatus.Connected;

    // subscribe to new slots
    this._blockSubscription = setInterval(updateSlot, SLOT_UPDATE_INTERVAL);
  }

  public async deinit() {
    if (this._connection && this._blockSubscription) {
      clearInterval(this._blockSubscription);
    }

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
    cb?: (success: boolean) => void,
  ): ITXModalData {
    throw new Error('unsupported');
  }
}