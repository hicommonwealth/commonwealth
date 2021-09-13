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
  StargateClient
} from '@cosmjs/stargate';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { MsgSubmitProposal } from 'cosmjs-types/cosmos/gov/v1beta1/tx';
import {
  EncodeObject,
  makeSignDoc,
  TxBodyEncodeObject,
  Registry,
  makeAuthInfoBytes,
  encodePubkey,
  coins,
} from '@cosmjs/proto-signing';
import { toBase64, fromBase64 } from '@cosmjs/encoding';
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

  public async sendTx(account: CosmosAccount, tx: EncodeObject): Promise<string> {
    // TODO: error handling
    const wallets = this.app.wallets.availableWallets(ChainBase.CosmosSDK);
    if (!wallets) throw new Error('No cosmos wallet found');

    // TODO: support multiple wallets
    if (this._app.chain.network === ChainNetwork.Terra) {
      throw new Error('Tx not yet supported on Terra');
    }
    const wallet = wallets[0] as KeplrWebWalletController;
    if (!wallet.enabled) {
      await wallet.enable();
    }

    // these parameters will be overridden by the wallet
    // TODO: can it be simulated?
    const DEFAULT_FEE: StdFee = {
      gas: '180000',
      amount: [{ amount: (2.5e-8).toFixed(9), denom: this.denom }]
    };
    const DEFAULT_MEMO = '';

    // sign the transaction using keplr (for now)
    console.log('Signing...');
    const stargateClient = await StargateClient.connect(this._url);
    console.log(wallet);
    const signer = wallet.offlineSigner;
    const { pubkey, address } = wallet.accounts[0];
    // TODO: verify address === account.address
    const encodedPubkey = encodePubkey({
      type: 'tendermint/PubKeySecp256k1',
      value: toBase64(pubkey),
    });
    const txBodyFields: TxBodyEncodeObject = {
      typeUrl: '/cosmos.tx.v1beta1.TxBody',
      value: {
        messages: [ tx ],
      },
    };
    // TODO: ensure all gov types are in the registry
    const registry = new Registry([
      ['/cosmos.gov.v1beta1.MsgSubmitProposal', MsgSubmitProposal],
    ]);
    console.log('encoding', txBodyFields);
    const txBodyBytes = registry.encode(txBodyFields);
    const { accountNumber, sequence } = (await stargateClient.getSequence(account.address))!;
    // TODO: configure
    const feeAmount = coins(2000, this.denom);
    const gasLimit = 200000;
    const authInfoBytes = makeAuthInfoBytes([{ pubkey: encodedPubkey, sequence }], feeAmount, gasLimit);

    // TODO: this doesn't work, because we need the correct chainId for keplr to sign
    const chainId = await stargateClient.getChainId();
    const signDoc = makeSignDoc(txBodyBytes, authInfoBytes, chainId, accountNumber);
    const { signature } = await signer.signDirect(account.address, signDoc);

    // send the transaction
    //  (we reinitialize the client here in order to send on any network, not just keplr supported)
    const txRaw = TxRaw.fromPartial({
      bodyBytes: txBodyBytes,
      authInfoBytes,
      signatures: [fromBase64(signature.signature)],
    });
    const txRawBytes = Uint8Array.from(TxRaw.encode(txRaw).finish());
    const result = await stargateClient.broadcastTx(txRawBytes);
    stargateClient.disconnect();
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
