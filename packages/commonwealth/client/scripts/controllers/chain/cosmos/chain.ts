import type { EncodeObject } from '@cosmjs/proto-signing';

import type {
  BankExtension,
  GovExtension,
  QueryClient,
  StakingExtension,
  StdFee,
} from '@cosmjs/stargate';
import type { Event, Tendermint34Client } from '@cosmjs/tendermint-rpc';
import {
  ChainNetwork,
  CosmosGovernanceVersion,
  WalletId,
} from '@hicommonwealth/shared';
import BN from 'bn.js';

import { CosmosToken } from 'controllers/chain/cosmos/types';
import moment from 'moment';
import { LCD } from 'shared/chain/types/cosmos';
import type { IApp } from 'state';
import { ApiStatus } from 'state';
import ChainInfo from '../../../models/ChainInfo';
import {
  IChainModule,
  ITXData,
  ITXModalData,
} from '../../../models/interfaces';
import EVMKeplrWebWalletController from '../../app/webWallets/keplr_ethereum_web_wallet';
import KeplrWebWalletController from '../../app/webWallets/keplr_web_wallet';
import LeapWebWalletController from '../../app/webWallets/leap_web_wallet';
import WebWalletController from '../../app/web_wallets';
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

    if (
      chain?.ChainNode?.cosmosGovernanceVersion ===
        CosmosGovernanceVersion.v1 ||
      chain?.ChainNode?.cosmosGovernanceVersion ===
        CosmosGovernanceVersion.v1beta1Failed
    ) {
      try {
        const lcdUrl = `${window.location.origin}/cosmosAPI/v1/${chain.id}`;
        console.log(`Starting LCD API at ${lcdUrl}...`);
        const lcd = await getLCDClient(lcdUrl);
        this._lcd = lcd;
      } catch (e) {
        console.error('Error starting LCD client: ', e);
      }
    }

    await this.fetchBlock(); // Poll for new block immediately
  }

  private async fetchBlock(): Promise<void> {
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
    } catch (e) {
      console.error('Error fetching block: ', e);
    }
  }

  public async fetchPoolParams(): Promise<CosmosToken> {
    const {
      pool: { bondedTokens },
    } = await this._api.staking.pool();
    this._staked = this.coins(new BN(bondedTokens));
    return this._staked;
  }

  public async fetchStakingParams(): Promise<string> {
    const {
      params: { bondDenom },
    } = await this._api.staking.params();
    this._denom = bondDenom;
    return this._denom;
  }

  public async deinit(): Promise<void> {
    this.app.chain.networkStatus = ApiStatus.Disconnected;
  }

  public async sendTx(
    account: CosmosAccount,
    tx: EncodeObject,
  ): Promise<readonly Event[]> {
    const chain = this._app.chain;
    // TODO: error handling
    // TODO: support multiple wallets
    if (chain.network === ChainNetwork.Terra) {
      throw new Error('Tx not yet supported on Terra');
    }

    const activeAddress = this._app.user.activeAccount?.address;
    const walletId = this._app.user.addresses?.find(
      (a) => a.address === activeAddress && a.community?.id === chain.id,
    )?.walletId;
    const isKeplr = walletId === WalletId.Keplr;
    const isLeap = walletId === WalletId.Leap;
    let wallet;

    if (isKeplr) {
      wallet = WebWalletController.Instance.getByName(
        WalletId.Keplr,
      ) as KeplrWebWalletController;
    } else if (isLeap) {
      wallet = WebWalletController.Instance.getByName(
        WalletId.Leap,
      ) as LeapWebWalletController;
    } else if (walletId) {
      wallet = WebWalletController.Instance.getByName(
        WalletId.KeplrEthereum,
      ) as EVMKeplrWebWalletController;
    } else {
      throw new Error('Cosmos wallet not found');
    }

    if (!wallet.enabled) {
      await wallet.enable();
    }

    const cosm = await import('@cosmjs/stargate');
    const dbId = chain.meta.id;
    let client;

    // TODO: To check if ethermint, we can get slip44 cointype from Cosmos Chain Directory instead of hardcoding
    // TODO: WARNING: this breaks Evmos txn signing with Keplr. Injective txn signing is already broken...
    // if (COSMOS_EVM_CHAINS.some((c) => c === dbId)) {
    //   const chainId = wallet.getChainId();
    //
    //   client = await EthSigningClient(
    //     {
    //       restUrl: `${window.location.origin}/cosmosAPI/v1/${dbId}`,
    //       chainId,
    //       path: dbId,
    //     },
    //     wallet.offlineSigner,
    //   );
    // } else {
    //   client = await getSigningClient(
    //     chain.meta.node.url,
    //     wallet.offlineSigner,
    //   );
    // }

    client = await getSigningClient(chain.meta.node.url, wallet.offlineSigner);

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
        DEFAULT_MEMO,
      );
      console.log(result);
      if (cosm.isDeliverTxFailure(result)) {
        throw new Error(`TX execution failed: ${result?.rawLog}`);
      } else if (cosm.isDeliverTxSuccess(result)) {
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
    cb?: (success: boolean) => void,
  ): ITXModalData {
    throw new Error('unsupported');
  }
}

export default CosmosChain;
