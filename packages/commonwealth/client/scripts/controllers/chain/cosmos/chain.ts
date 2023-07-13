import type { EncodeObject } from '@cosmjs/proto-signing';

import type {
  BankExtension,
  GovExtension,
  StakingExtension,
  StdFee,
} from '@cosmjs/stargate';
import type { QueryClient } from '@cosmjs/stargate';
import type { Event } from '@cosmjs/tendermint-rpc';
import type { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import BN from 'bn.js';
import { ChainNetwork, WalletId } from 'common-common/src/types';

import { CosmosToken } from 'controllers/chain/cosmos/types';
import moment from 'moment';
import type { IApp } from 'state';
import { ApiStatus } from 'state';
import { LCD } from 'chain-events/src/chains/cosmos/types';
import ChainInfo from '../../../models/ChainInfo';
import {
  IChainModule,
  ITXData,
  ITXModalData,
} from '../../../models/interfaces';
import WebWalletController from '../../app/web_wallets';
import type KeplrWebWalletController from '../../app/webWallets/keplr_web_wallet';
import type CosmosAccount from './account';
import {
  getLCDClient,
  getRPCClient,
  getSigningClient,
  getTMClient,
} from './chain.utils';

/* eslint-disable @typescript-eslint/no-unused-vars */

export interface ICosmosTXData extends ITXData {
  chainId: string;
  accountNumber: number;
  sequence: number;

  // skip simulating the tx twice by saving the original estimated gas
  gas: number;
}

export type CosmosApiType = QueryClient &
  StakingExtension &
  GovExtension &
  BankExtension;

class CosmosChain implements IChainModule<CosmosToken, CosmosAccount> {
  private _api: CosmosApiType;
  private _lcd: LCD;
  public get api() {
    return this._api;
  }
  public get lcd() {
    return this._lcd;
  }

  // TODO: rename this something like "bankDenom" or "gasDenom" or "masterDenom"
  private _denom: string;
  public get denom(): string {
    return this._denom;
  }

  private _staked: CosmosToken;
  public get staked(): CosmosToken {
    return this._staked;
  }

  private _app: IApp;
  public get app() {
    return this._app;
  }

  constructor(app: IApp) {
    this._app = app;
  }

  public coins(n: number | BN, inDollars?: boolean) {
    // never interpret a CosmosToken in dollars
    return new CosmosToken(this.denom, n);
  }

  private _tmClient: Tendermint34Client;
  private _isFetchingPoolParams: boolean;
  private _isFetchingStakingParams: boolean;
  private _isFetchingBlock: boolean;

  public async init(chain: ChainInfo, reset = false) {
    const url = `${window.location.origin}/cosmosAPI/${chain.id}`;

    // TODO: configure broadcast mode
    try {
      console.log(`Starting Tendermint client...`);
      this._tmClient = await getTMClient(url);
    } catch (e) {
      console.error('Error starting tendermint client: ', e);
    }

    if (this.app.chain.networkStatus === ApiStatus.Disconnected) {
      this.app.chain.networkStatus = ApiStatus.Connecting;
    }

    try {
      console.log(`Starting RPC API at ${url}...`);
      this._api = await getRPCClient(this._tmClient);
    } catch (e) {
      console.error('Error starting RPC client: ', e);
    }

    if (chain?.cosmosGovernanceVersion === 'v1') {
      try {
        const lcdUrl = `${window.location.origin}/cosmosLCD/${chain.id}`;
        console.log(`Starting LCD API at ${lcdUrl}...`);
        const lcd = await getLCDClient(lcdUrl);
        this._lcd = lcd;
      } catch (e) {
        console.error('Error starting LCD client: ', e);
      }
    }

    await this.fetchPoolParams();
    await this.fetchBlock(); // Poll for new block immediately
    await this.fetchStakingParams();
  }

  private async fetchPoolParams(): Promise<void> {
    if (this._isFetchingPoolParams) return;
    this._isFetchingPoolParams = true;
    try {
      const {
        pool: { bondedTokens },
      } = await this._api.staking.pool();
      this._staked = this.coins(new BN(bondedTokens));
    } catch (e) {
      console.error('Error fetching pool params: ', e);
    } finally {
      this._isFetchingPoolParams = false;
    }
  }

  private async fetchBlock(): Promise<void> {
    if (this._isFetchingBlock) return;
    this._isFetchingBlock = true;
    try {
      const { block } = await this._tmClient.block();
      const height = +block.header.height;
      const { block: prevBlock } = await this._tmClient.block(height - 1);
      // TODO: check if this is correctly seconds or milliseconds
      const time = moment.unix(block.header.time.valueOf() / 1000);
      this.app.chain.block.duration =
        block.header.time.valueOf() - prevBlock.header.time.valueOf();
      this.app.chain.block.lastTime = time;
      this.app.chain.block.height = height;
      this.app.chain.networkStatus = ApiStatus.Connected;
      this._isFetchingBlock = false;
    } catch (e) {
      console.error('Error fetching block: ', e);
      this._isFetchingBlock = false;
    }
  }

  private async fetchStakingParams(): Promise<void> {
    if (this._isFetchingStakingParams) return;
    this._isFetchingStakingParams = true;
    try {
      const {
        params: { bondDenom },
      } = await this._api.staking.params();
      this._denom = bondDenom;
      this._isFetchingStakingParams = false;
    } catch (e) {
      console.error('Error fetching staking params: ', e);
      this._isFetchingStakingParams = false;
    }
  }

  public async deinit(): Promise<void> {
    this.app.chain.networkStatus = ApiStatus.Disconnected;
  }

  public async sendTx(
    account: CosmosAccount,
    tx: EncodeObject
  ): Promise<readonly Event[]> {
    // TODO: error handling
    // TODO: support multiple wallets
    if (this._app.chain.network === ChainNetwork.Terra) {
      throw new Error('Tx not yet supported on Terra');
    }
    const wallet = WebWalletController.Instance.getByName(
      WalletId.Keplr
    ) as KeplrWebWalletController;
    if (!wallet) throw new Error('Keplr wallet not found');
    if (!wallet.enabled) {
      await wallet.enable();
    }
    const cosm = await import('@cosmjs/stargate');
    const client = await getSigningClient(
      this._app.chain.meta.node.url,
      wallet.offlineSigner
    );

    // these parameters will be overridden by the wallet
    // TODO: can it be simulated?
    const DEFAULT_FEE: StdFee = {
      gas: '180000',
      amount: [{ amount: (2.5e-8).toFixed(9), denom: this.denom }],
    };
    const DEFAULT_MEMO = '';

    // send the transaction using keplr-supported signing client
    try {
      const result = await client.signAndBroadcast(
        account.address,
        [tx],
        DEFAULT_FEE,
        DEFAULT_MEMO
      );
      console.log(result);
      if (cosm.isBroadcastTxFailure(result)) {
        throw new Error('TX execution failed.');
      } else if (cosm.isBroadcastTxSuccess(result)) {
        const txHash = result.transactionHash;
        const txResult = await this._tmClient.tx({
          hash: Buffer.from(txHash, 'hex'),
        });
        return txResult.result.events;
      } else {
        throw new Error('Unknown broadcast result');
      }
    } catch (err) {
      console.log(err.message);
      throw err;
    }
  }

  public createTXModalData(
    author: CosmosAccount,
    txFunc,
    txName: string,
    objName: string,
    cb?: (success: boolean) => void
  ): ITXModalData {
    throw new Error('unsupported');
  }
}

export default CosmosChain;
