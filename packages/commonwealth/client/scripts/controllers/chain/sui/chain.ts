import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { SuiClient } from '@mysten/sui/client';
import BN from 'bn.js';

import moment from 'moment';
import type { IApp } from 'state';
import { ApiStatus } from 'state';
import type { IChainModule, ITXModalData } from '../../../models/interfaces';
import type SuiAccount from './account';

import { z } from 'zod';
import { getChainDecimals } from '../../app/webWallets/utils';
import { SuiToken } from './types';

export default class SuiChain implements IChainModule<SuiToken, SuiAccount> {
  private _denom: string;
  public get denom(): string {
    return this._denom;
  }

  private _decimals: BN;

  private _app: IApp;
  public get app() {
    return this._app;
  }

  private _client: SuiClient;
  public get client() {
    return this._client;
  }

  constructor(app: IApp) {
    this._app = app;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async init(chain: z.infer<typeof ExtendedCommunity>, reset = false) {
    // default to 9 decimals for SUI
    const decimals = getChainDecimals(chain.id || '', chain.base) || 9;

    this._decimals = new BN(10).pow(new BN(decimals));
    this._denom = chain.default_symbol;

    const url = chain?.ChainNode?.url || '';

    // Create SuiClient instance with connection to the network
    try {
      // Use direct import instead of dynamic import
      this._client = new SuiClient({ url });

      // Get the latest system state for chain info
      const systemState = await this._client.getLatestSuiSystemState();

      // Get latest checkpoint for block height
      const latestCheckpoints =
        await this._client.getLatestCheckpointSequenceNumber();
      this.app.chain.block.height = Number(latestCheckpoints);

      // Sui has ~2.5s block time
      this.app.chain.block.duration = 2500;

      // Use current time as an approximation
      this.app.chain.block.lastTime = moment();

      this.app.chain.networkStatus = ApiStatus.Connected;
      console.log(
        `Connected to Sui network: ${url}, epoch: ${systemState.epoch}`,
      );
    } catch (e) {
      console.error('Error initializing Sui connection:', e);
      this.app.chain.networkStatus = ApiStatus.Disconnected;
    }
  }

  public deinit() {
    this.app.chain.networkStatus = ApiStatus.Disconnected;
    // No explicit cleanup needed for SuiClient
    // @ts-expect-error StrictNullChecks
    this._client = null;
  }

  public coins(n: number | BN, inDollars?: boolean) {
    return new SuiToken(this.denom, n, inDollars, this._decimals);
  }

  public createTXModalData(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    author: SuiAccount,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    txFunc,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    txName: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    objName: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    cb?: (success: boolean) => void,
  ): ITXModalData {
    throw new Error('Sui transactions not yet implemented');
  }
}
