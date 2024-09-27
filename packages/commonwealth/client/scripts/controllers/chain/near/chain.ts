import { ExtendedCommunity } from '@hicommonwealth/schemas';
import type { IApp } from 'state';
import { ApiStatus } from 'state';
import { z } from 'zod';
import type { IChainModule, ITXModalData } from '../../../models/interfaces';
import type { NearAccount } from './account';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class NearChain implements IChainModule<any, NearAccount> {
  public get denom() {
    return this.app.chain.currency;
  }

  public coins() {
    throw new Error('not implemented');
  }

  private _networkId = 'testnet';

  public get isMainnet() {
    return this._networkId === 'mainnet';
  }

  private _app: IApp;
  public get app() {
    return this._app;
  }

  constructor(app: IApp) {
    this._app = app;
  }

  public init(chain: z.infer<typeof ExtendedCommunity>): Promise<void> {
    const networkSuffix = chain?.id?.split('.').pop();
    this._networkId =
      chain.id === 'near-testnet' || networkSuffix === 'testnet'
        ? 'testnet'
        : 'mainnet';
    return Promise.resolve();
  }

  public async deinit(): Promise<void> {
    this.app.chain.networkStatus = ApiStatus.Disconnected;
  }

  public createTXModalData(): ITXModalData {
    throw new Error('Txs not implemented');
  }
}

export default NearChain;
