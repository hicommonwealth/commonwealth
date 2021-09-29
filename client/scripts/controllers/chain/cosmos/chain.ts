import {
  ITXModalData,
  NodeInfo,
  IChainModule,
  ITXData,
  ChainBase,
  ChainNetwork
} from 'models';
import m from 'mithril';
import _ from 'lodash';
import { ApiStatus, IApp } from 'state';
import moment from 'moment';
import { BlocktimeHelper } from 'helpers';
import BN from 'bn.js';
import { CosmosToken } from 'controllers/chain/cosmos/types';

import {
  StdFee,
  isBroadcastTxSuccess,
  isBroadcastTxFailure,
  QueryClient,
  StakingExtension,
  setupStakingExtension,
  GovExtension,
  setupGovExtension,
  BankExtension,
  setupBankExtension,
  SigningStargateClient
} from '@cosmjs/stargate';
import { Tendermint34Client, Event } from '@cosmjs/tendermint-rpc';
import { EncodeObject } from '@cosmjs/proto-signing';
import CosmosAccount from './account';
import KeplrWebWalletController from '../../app/webWallets/keplr_web_wallet';
import TerraStationWebWalletController from '../../app/webWallets/terra_station_web_wallet';

export interface ICosmosTXData extends ITXData {
  chainId: string;
  accountNumber: number;
  sequence: number;

  // skip simulating the tx twice by saving the original estimated gas
  gas: number;
}

export type CosmosApiType = QueryClient
  & StakingExtension
  & GovExtension
  & BankExtension;

class CosmosChain implements IChainModule<CosmosToken, CosmosAccount> {
  private _url: string;
  public get url() { return this._url; }
  private _api: CosmosApiType;
  public get api() { return this._api; }

  private _blockSubscription: NodeJS.Timeout;

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
  public get app() { return this._app; }

  constructor(app: IApp) {
    this._app = app;
  }

  public coins(n: number | BN, inDollars?: boolean) {
    // never interpret a CosmosToken in dollars
    return new CosmosToken(this.denom, n);
  }

  private _blocktimeHelper: BlocktimeHelper = new BlocktimeHelper();
  private _tmClient: Tendermint34Client;
  public async init(node: NodeInfo, reset = false) {
    // A note on REST RPC: gaiacli exposes a command line option "rest-server" which
    // creates the endpoint necessary. However, it doesn't send headers correctly
    // on its own, so you need to configure a reverse-proxy server (I did it with nginx)
    // that forwards the requests to it, and adds the header 'Access-Control-Allow-Origin: *'
    /* eslint-disable prefer-template */
    this._url = node.url;

    console.log(`Starting Tendermint RPC API at ${this._url}...`);
    // TODO: configure broadcast mode
    this._tmClient = await Tendermint34Client.connect(this._url);
    this._api = QueryClient.withExtensions(
      this._tmClient,
      setupGovExtension,
      setupStakingExtension,
      setupBankExtension,
    );
    if (this.app.chain.networkStatus === ApiStatus.Disconnected) {
      this.app.chain.networkStatus = ApiStatus.Connecting;
    }

    // Poll for new block immediately and then every 2s
    const fetchBlockJob = async () => {
      const { block } = await this._tmClient.block();
      const height = +block.header.height;
      if (height > this.app.chain.block.height) {
        const time = moment.unix(block.header.time.valueOf() / 1000);
        this._blocktimeHelper.stamp(time, height - this.app.chain.block.height);
        this.app.chain.block.height = height;
        m.redraw();
      }
    };
    await fetchBlockJob();
    this._blockSubscription = setInterval(fetchBlockJob, 6000);

    const { pool: { bondedTokens } } = await this._api.staking.pool();
    this._staked = this.coins(new BN(bondedTokens));

    const { params: { bondDenom } } = await this._api.staking.params();
    this._denom = bondDenom;
    this.app.chain.networkStatus = ApiStatus.Connected;
    m.redraw();
  }

  public async deinit(): Promise<void> {
    this.app.chain.networkStatus = ApiStatus.Disconnected;
    if (this._blockSubscription) {
      clearInterval(this._blockSubscription);
    }
  }

  public async sendTx(account: CosmosAccount, tx: EncodeObject): Promise<readonly Event[]> {
    // TODO: error handling
    // TODO: support multiple wallets
    if (this._app.chain.network === ChainNetwork.Terra) {
      throw new Error('Tx not yet supported on Terra');
    }
    const wallet = this.app.wallets.getByName('keplr') as KeplrWebWalletController;
    if (!wallet) throw new Error('Keplr wallet not found');
    if (!wallet.enabled) {
      await wallet.enable();
    }
    const client = await SigningStargateClient.connectWithSigner(this._app.chain.meta.url, wallet.offlineSigner);

    // these parameters will be overridden by the wallet
    // TODO: can it be simulated?
    const DEFAULT_FEE: StdFee = {
      gas: '180000',
      amount: [{ amount: (2.5e-8).toFixed(9), denom: this.denom }]
    };
    const DEFAULT_MEMO = '';

    // send the transaction using keplr-supported signing client
    try {
      const result = await client.signAndBroadcast(account.address, [ tx ], DEFAULT_FEE, DEFAULT_MEMO);
      console.log(result);
      if (isBroadcastTxFailure(result)) {
        throw new Error('TX execution failed.');
      } else if (isBroadcastTxSuccess(result)) {
        const txHash = result.transactionHash;
        const txResult = await this._tmClient.tx({ hash: Buffer.from(txHash, 'hex') });
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
    cb?: (success: boolean) => void,
  ): ITXModalData {
    throw new Error('unsupported');
  }
}

export default CosmosChain;
