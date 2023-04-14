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
import type { ChainInfo, IChainModule, ITXData, ITXModalData } from 'models';
import { redraw } from 'mithrilInterop';
import moment from 'moment';
import type { IApp } from 'state';
import { ApiStatus } from 'state';
import type { LCD } from 'chain-events/src/chains/cosmos/types';
import type KeplrWebWalletController from '../../app/webWallets/keplr_web_wallet';
import type CosmosAccount from './account';
import { createLCDClient } from 'common-common/src/cosmos-ts/src/codegen/cosmos/lcd';

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

  public async init(chain: ChainInfo, reset = false) {
    const url = `${window.location.origin}/cosmosAPI/${chain.id}`;
    console.log(`Starting Tendermint RPC API at ${url}...`);
    // TODO: configure broadcast mode

    const tm = await import('@cosmjs/tendermint-rpc');
    this._tmClient = await tm.Tendermint34Client.connect(url);
    const cosm = await import('@cosmjs/stargate');
    this._api = cosm.QueryClient.withExtensions(
      this._tmClient,
      cosm.setupGovExtension,
      cosm.setupStakingExtension,
      cosm.setupBankExtension
    );

    if (chain?.cosmosGovernanceVersion === 'v1') {
      const lcdUrl = `${window.location.origin}/cosmosLCD/${chain.id}`;
      const lcd = await createLCDClient({
        restEndpoint: lcdUrl,
      });
      this._lcd = lcd;
    }

    const {
      pool: { bondedTokens },
    } = await this._api.staking.pool();
    this._staked = this.coins(new BN(bondedTokens));

    const {
      params: { bondDenom },
    } = await this._api.staking.params();
    this._denom = bondDenom;

    if (this.app.chain.networkStatus === ApiStatus.Disconnected) {
      this.app.chain.networkStatus = ApiStatus.Connecting;
    }

    // Poll for new block immediately
    const { block } = await this._tmClient.block();
    const height = +block.header.height;
    const { block: prevBlock } = await this._tmClient.block(height - 1);
    const time = moment.unix(block.header.time.valueOf() / 1000);
    // TODO: check if this is correctly seconds or milliseconds
    this.app.chain.block.duration =
      block.header.time.valueOf() - prevBlock.header.time.valueOf();
    this.app.chain.block.lastTime = time;
    this.app.chain.block.height = height;

    this.app.chain.networkStatus = ApiStatus.Connected;
    redraw();
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
    const wallet = this.app.wallets.getByName(
      WalletId.Keplr
    ) as KeplrWebWalletController;
    if (!wallet) throw new Error('Keplr wallet not found');
    if (!wallet.enabled) {
      await wallet.enable();
    }
    const cosm = await import('@cosmjs/stargate');
    const client = await cosm.SigningStargateClient.connectWithSigner(
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
