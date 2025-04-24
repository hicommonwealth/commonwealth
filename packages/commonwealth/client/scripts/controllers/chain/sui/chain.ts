import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { ChainNetwork, SUI_MAINNET_CHAIN_ID } from '@hicommonwealth/shared';
import type { Coin } from 'adapters/currency';
import { IChainModule } from 'models/interfaces';
import moment from 'moment';
import type { IApp } from 'state';
import { ApiStatus } from 'state';
import { z } from 'zod';
import SuiAccount from './account';
import { SuiCoin, SuiToken } from './types';

class SuiChain implements IChainModule<SuiCoin, SuiAccount> {
  private _app: IApp;
  public rpcUrl: string;
  private _initializedChain: boolean = false;
  private _tokens: SuiToken[] = [];

  constructor(app: IApp) {
    this._app = app;
  }

  public get meta() {
    return this._app.chain?.meta;
  }

  public get network(): ChainNetwork {
    return this._app.chain?.meta?.network as ChainNetwork;
  }

  public get api() {
    // This will be replaced with a proper Sui API client in Phase 2
    return null;
  }

  public get denom(): string {
    return 'SUI';
  }

  public get coins(): Coin[] {
    return [];
  }

  public get tokens(): SuiToken[] {
    return this._tokens;
  }

  public get networkStatus(): ApiStatus {
    if (!this._initializedChain) {
      return ApiStatus.Disconnected;
    }
    if (this._app.chain?.networkStatus) {
      return this._app.chain.networkStatus;
    }
    return ApiStatus.Connected;
  }

  public getChainId(): string {
    return SUI_MAINNET_CHAIN_ID;
  }

  public async init(meta: z.infer<typeof ExtendedCommunity>): Promise<void> {
    // Initialize the Sui chain with the provided RPC endpoint
    if (meta.ChainNode?.length > 0 && meta.ChainNode[0].url) {
      this.rpcUrl = meta.ChainNode[0].url;
    } else {
      // Default RPC endpoint for Sui if none provided
      this.rpcUrl = 'https://sui-rpc.publicnode.com';
    }

    try {
      // Initialize the Sui client and fetch basic chain info
      // This will be implemented in Phase 2

      // For now, set default tokens
      this._tokens = [
        {
          type: '0x2::sui::SUI',
          name: 'Sui',
          symbol: 'SUI',
          decimals: 9,
        },
      ];

      // Set chain initialized
      this._initializedChain = true;
      this._app.chain.networkStatus = ApiStatus.Connected;
      this._app.chain.block.lastTime = moment();
    } catch (error) {
      console.error('Failed to initialize Sui chain:', error);
      this._app.chain.networkStatus = ApiStatus.Disconnected;
    }
  }

  public async deinit(): Promise<void> {
    // Clean up any connections or listeners
    this._initializedChain = false;
    this._tokens = [];
  }
}

export default SuiChain;
