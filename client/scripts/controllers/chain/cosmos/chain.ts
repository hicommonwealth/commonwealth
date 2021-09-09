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
import { Subscription } from 'xstream';
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
} from '@cosmjs/stargate';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
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

  // TODO: use this in the UI
  private _chainId: string;
  public get chainId(): string {
    return this._chainId;
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

    console.log(`Starting REST API at ${this._url}...`);

    console.log('tmClient.connect!');
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
    console.log('tmClient.status!');
    const { nodeInfo } = await this._tmClient.status();
    this._chainId = nodeInfo.network;
    console.log(`chain id: ${this._chainId}`);
    this.app.chain.networkStatus = ApiStatus.Connected;

    // Poll for new block immediately and then every 2s
    const fetchBlockJob = async () => {
      console.log('tmClient.block!');
      const { block } = await this._tmClient.block();
      console.log(block);
      const height = +block.header.height;
      if (height > this.app.chain.block.height) {
        const time = moment.unix(block.header.time.valueOf() / 1000);
        this._blocktimeHelper.stamp(time);
        this.app.chain.block.height = height;
        m.redraw();
      }
    };
    await fetchBlockJob();
    // TODO: reenable this
    // this._blockSubscription = setInterval(fetchBlockJob, 2000);

    console.log('api.staking.pool!');
    const { pool: { bondedTokens } } = await this._api.staking.pool();
    this._staked = this.coins(new BN(bondedTokens));
    console.log('api.staking.params!');
    const { params: { bondDenom } } = await this._api.staking.params();
    this._denom = bondDenom;
    m.redraw();
  }

  public async deinit(): Promise<void> {
    this.app.chain.networkStatus = ApiStatus.Disconnected;
    if (this._blockSubscription) {
      clearInterval(this._blockSubscription);
    }
  }

  public async sendTx(account: CosmosAccount, tx: EncodeObject): Promise<string> {
    // TODO: error handling
    const wallets = this.app.wallets.availableWallets(ChainBase.CosmosSDK);
    if (!wallets) throw new Error('No cosmos wallet found');

    // TODO: support multiple wallets
    let wallet;
    if (ChainNetwork.Terra) {
      wallet = wallets[0] as TerraStationWebWalletController;
    } else {
      wallet = wallets[0] as KeplrWebWalletController;
    }
    const client = await wallet.getClient(this.app.chain.meta.url, account.address);

    // these parameters will be overridden by the wallet
    // TODO: can it be simulated?
    const DEFAULT_FEE: StdFee = {
      gas: '180000',
      amount: [{ amount: (2.5e-8).toFixed(9), denom: this.denom }]
    };
    const DEFAULT_MEMO = '';

    // send the transaction using keplr-supported signing client
    const result = await client.signAndBroadcast(account.address, [ tx ], DEFAULT_FEE, DEFAULT_MEMO);
    if (isBroadcastTxFailure(result)) {
      console.log(result);
      throw new Error('TX execution failed.');
    } else if (isBroadcastTxSuccess(result)) {
      console.log(result);
      return result.transactionHash;
    } else {
      throw new Error('Unknown broadcast result');
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
