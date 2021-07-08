import {
  ITXModalData,
  NodeInfo,
  IChainModule,
  TransactionStatus,
  ITXData,
} from 'models';
import m from 'mithril';
import _ from 'lodash';
import { ApiStatus, IApp } from 'state';
import moment from 'moment';
import { BlocktimeHelper } from 'helpers';
import BN from 'bn.js';
import { EventEmitter } from 'events';
import { CosmosToken } from 'controllers/chain/cosmos/types';

import {
  makeStdTx,
  StdTx,
  StdFee,
  BroadcastTxResult,
  isBroadcastTxFailure,
  AuthExtension,
  GovExtension,
  LcdClient,
  makeSignDoc,
  Msg,
  setupAuthExtension,
  setupGovExtension,
  setupStakingExtension,
  setupBankExtension,
  setupSupplyExtension,
  BankExtension,
  SupplyExtension,
  StakingExtension
} from '@cosmjs/launchpad';
import { CosmosAccount } from './account';

export interface ICosmosTXData extends ITXData {
  chainId: string;
  accountNumber: number;
  sequence: number;

  // skip simulating the tx twice by saving the original estimated gas
  gas: number;
}

export type CosmosApiType = LcdClient
  & StakingExtension
  & AuthExtension
  & GovExtension
  & BankExtension
  & SupplyExtension;

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
  public async init(node: NodeInfo, reset = false) {
    // A note on REST RPC: gaiacli exposes a command line option "rest-server" which
    // creates the endpoint necessary. However, it doesn't send headers correctly
    // on its own, so you need to configure a reverse-proxy server (I did it with nginx)
    // that forwards the requests to it, and adds the header 'Access-Control-Allow-Origin: *'
    /* eslint-disable prefer-template */
    this._url = node.url;

    console.log(`Starting REST API at ${this._url}...`);

    console.log('cosmjs api');
    // TODO: configure broadcast mode
    this._api = LcdClient.withExtensions(
      { apiUrl: this._url },
      setupAuthExtension,
      setupGovExtension,
      setupStakingExtension,
      setupBankExtension,
      setupSupplyExtension,
    );
    if (this.app.chain.networkStatus === ApiStatus.Disconnected) {
      this.app.chain.networkStatus = ApiStatus.Connecting;
    }
    const nodeInfo = await this._api.nodeInfo();
    this._chainId = nodeInfo.node_info.network;
    console.log(`chain id: ${this._chainId}`);
    this.app.chain.networkStatus = ApiStatus.Connected;

    // Poll for new block immediately and then every 2s
    const fetchBlockJob = async () => {
      const block = await this._api.blocksLatest();
      const height = +block.block.header.height;
      const time = moment(block.block.header.time);
      if (height !== this.app.chain.block.height) {
        this._blocktimeHelper.stamp(moment(time));
        this.app.chain.block.height = height;
        m.redraw();
      }
    };
    await fetchBlockJob();
    this._blockSubscription = setInterval(fetchBlockJob, 2000);

    const { result: { bonded_tokens } } = await this._api.staking.pool();
    this._staked = this.coins(new BN(bonded_tokens));
    const { result: { bond_denom } } = await this._api.staking.parameters();
    this._denom = bond_denom;
    m.redraw();
  }

  public async deinit(): Promise<void> {
    this.app.chain.networkStatus = ApiStatus.Disconnected;
    if (this._blockSubscription) {
      clearInterval(this._blockSubscription);
    }
  }

  private async _simulate(msg: Msg, memo: string): Promise<number> {
    // TODO
    return 180000;
  }

  public async tx(
    txName: string,
    senderAddress: string,
    args: object,
    memo: string = '',
    gas?: number,
    gasDenom: string = 'uatom',
  ) {
    const msg: Msg = {
      type: txName,
      value: args,
    };

    // estimate the needed gas amount
    if (!gas) {
      gas = await this._simulate(msg, memo);
    }

    // generate unsigned version for CLI
    // TODO: test!
    const result = await this._api.auth.account(senderAddress);
    const { sequence, account_number: accountNumber } = result.result.value;
    const DEFAULT_GAS_PRICE = [{ amount: (2.5e-8).toFixed(9), denom: gasDenom }];
    const fee = { amount: DEFAULT_GAS_PRICE, gas: `${gas}` };
    const messageToSign = makeSignDoc([ msg ], fee, this.chainId, memo, sequence, accountNumber);
    return { msg, memo, fee, cmdData: { messageToSign, chainId: this.chainId, sequence, accountNumber, gas } };
  }

  public createTXModalData(
    author: CosmosAccount,
    txFunc,
    txName: string,
    objName: string,
    cb?: (success: boolean) => void,
  ): ITXModalData {
    const events = new EventEmitter();
    return {
      author,
      txType: txName,
      cb,
      txData: {
        events,
        unsignedData: async (): Promise<ICosmosTXData> => {
          const { cmdData: { messageToSign, chainId, accountNumber, gas, sequence } } = await txFunc();
          return {
            call: JSON.stringify({ type: 'cosmos-sdk/StdTx', value: messageToSign }),
            chainId,
            gas,
            accountNumber,
            sequence,
          };
        },
        transact: (signature?: string, computedGas?: number): void => {
          // perform transaction and coerce into compatible observable
          txFunc(computedGas).then(async ({ msg, memo, fee }) => {
            let txResult: BroadcastTxResult;

            // sign and make TX
            try {
              let stdTx: StdTx;
              if (!signature) {
                // create StdTx through API
                stdTx = await author.client.sign([ msg as Msg ], fee as StdFee, memo);
              } else {
                // manually construct StdTx using signature
                stdTx = makeStdTx(
                  { memo, fee, msgs: [ msg ] },
                  { signature, pub_key: author.pubKey },
                );
              }
              txResult = await author.client.broadcastTx(stdTx);
            } catch (e) {
              events.emit(TransactionStatus.Error.toString(), { err: e.message });
            }

            // handle result of broadcast
            if (isBroadcastTxFailure(txResult)) {
              // TODO: test
              events.emit(TransactionStatus.Error.toString(), { err: txResult.rawLog });
              return;
            }
            try {
              const indexedTx = await author.client.getTx(txResult.transactionHash);
              const height = indexedTx.height;
              const block = await author.client.getBlock(height);
              events.emit(TransactionStatus.Success.toString(), {
                blocknum: height,
                timestamp: moment(block.header.time),
                hash: block.id,
              });
            } catch (e) {
              // TODO: failed to fetch TX from block, but successfully broadcast?
              events.emit(TransactionStatus.Success.toString(), {
                blocknum: this.app.chain.block.height,
                timestamp: moment(),
                hash: '--',
              });
            }
          }).catch((err) => {
            console.error(err);
          });
        },
      }
    };
  }
}

export default CosmosChain;
