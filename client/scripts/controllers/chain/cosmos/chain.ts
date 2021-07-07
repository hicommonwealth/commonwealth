import {
  ITXModalData,
  NodeInfo,
  IChainModule,
} from 'models';
import * as m from 'mithril';
import { ApiStatus, IApp } from 'state';
import BN from 'bn.js';
import { CosmosToken } from 'adapters/chain/cosmos/types';
import { CosmosAccount } from './account';

class CosmosChain implements IChainModule<CosmosToken, CosmosAccount> {
  private _addressPrefix: string;
  public get addressPrefix() {
    return this._addressPrefix;
  }

  // TODO: rename this something like "bankDenom" or "gasDenom" or "masterDenom"
  private _denom: string;
  public get denom(): string {
    return this._denom || 'COS';
  }

  private _app: IApp;
  public get app() { return this._app; }

  constructor(app: IApp, addressPrefix: string) {
    this._app = app;
    this._addressPrefix = addressPrefix;
  }

  public coins(n: number | BN, inDollars?: boolean) {
    // never interpret a CosmosToken in dollars
    return new CosmosToken(this.denom, n);
  }

  public async init(node: NodeInfo, reset = false) {
    if (this.app.chain.networkStatus === ApiStatus.Disconnected) {
      this.app.chain.networkStatus = ApiStatus.Connecting;
    }

    // TODO: track blocks via this.app.chain.block.height
    // TODO: query denomination
    this.app.chain.networkStatus = ApiStatus.Connected;
    m.redraw();
  }

  public async deinit(): Promise<void> {
    this.app.chain.networkStatus = ApiStatus.Disconnected;
  }

  public createTXModalData(
    author: CosmosAccount,
    txFunc,
    txName: string,
    objName: string,
    cb?: (success: boolean) => void,
  ): ITXModalData {
    throw new Error('Unsupported');
  }
}

export default CosmosChain;
