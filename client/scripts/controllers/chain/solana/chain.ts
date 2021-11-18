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
  private _slotCallbackId: number;

  constructor(app: IApp) {
    this._app = app;
  }

  public async init(node: NodeInfo, reset = false) {
    // default to 6 decimals
    this._decimals = new BN(10).pow(new BN(node.chain.decimals || 6));
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

    const onSlotChange = async ({ slot }: solw3.SlotInfo) => {
      // slots are approx equal to block heights
      this.app.chain.block.height = slot;
      const timestamp = await this._connection.getBlockTime(slot);
      const prevTime = this.app.chain.block.lastTime;
      this.app.chain.block.lastTime = moment.unix(timestamp);
      if (prevTime) {
        this.app.chain.block.duration = timestamp - prevTime.unix();
      }
      m.redraw();
    }

    if (this.app.chain.networkStatus === ApiStatus.Disconnected) {
      this.app.chain.networkStatus = ApiStatus.Connecting;
    }

    // load current slot
    const currentSlot = await this._connection.getSlot();
    await onSlotChange({
      slot: currentSlot,
      parent: 0,
      root: 0,
    });

    this.app.chain.networkStatus = ApiStatus.Connected;

    // subscribe to new slots
    this._slotCallbackId = this._connection.onSlotChange(onSlotChange);
  }

  public async deinit() {
    if (this._connection && this._slotCallbackId) {
      this._connection.removeSlotChangeListener(this._slotCallbackId);
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