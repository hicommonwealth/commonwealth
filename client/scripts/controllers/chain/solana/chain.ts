import { ITXModalData, NodeInfo, IChainModule, ITXData } from 'models';
import { IApp } from 'state';
import BN from 'bn.js';

import { SolanaToken } from './types';
import SolanaAccount from './account';

export default class SolanaChain implements IChainModule<SolanaToken, SolanaAccount> {
  // TODO
  private _denom: string;
  public get denom(): string {
    return this._denom;
  }

  private _app: IApp;
  public get app() { return this._app; }

  constructor(app: IApp) {
    this._app = app;
  }

  public async init(node: NodeInfo, reset = false) {
    // TODO
  }

  public async deinit() {
    // TODO
  }

  public coins(n: number | BN, inDollars?: boolean) {
    return new SolanaToken(this.denom, n, inDollars);
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