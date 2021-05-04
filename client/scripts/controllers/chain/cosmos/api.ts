import * as $ from 'jquery';
import _ from 'lodash';
import { Subscription } from 'xstream';
import {
  AuthExtension,
  GovExtension,
  LcdClient,
  makeSignDoc,
  Msg,
  setupAuthExtension,
  setupGovExtension,
  setupStakingExtension,
  StakingExtension,
} from '@cosmjs/launchpad';
import { Client as TendermintClient, NewBlockHeaderEvent, Event } from '@cosmjs/tendermint-rpc';
import { ICosmosTXData } from './chain';

export interface ITx {
  msg: {
    type: string;
    value: any; // specific to the tx type
  };
  events: readonly Event[];
  memo: string;
}

export class CosmosApi {
  private _rpc: TendermintClient;
  private _eventHandlers: { [e: string]: (tx: ITx) => void | Promise<void> } = {};
  private _chainId: string;
  private _initialized: boolean;
  private _newBlockHeaderSubscription: Subscription;
  private _txSubscription: Subscription;

  private _lcdClient: LcdClient & StakingExtension & AuthExtension & GovExtension;
  public get chainId(): string {
    return this._chainId;
  }
  public readonly rpcUrl: string;
  public readonly restUrl: string;

  constructor(rpcUrl: string, restUrl: string) {
    this.rpcUrl = rpcUrl;
    this.restUrl = restUrl;
  }

  public async init(headerListener: (header: NewBlockHeaderEvent) => void) {
    console.log('cosmjs api');
    // TODO: configure broadcast mode
    this._lcdClient = LcdClient.withExtensions(
      { apiUrl: this.restUrl },
      setupAuthExtension,
      setupGovExtension,
      setupStakingExtension,
    );
    console.log('tendermint rpc');
    this._rpc = await TendermintClient.connect(this.rpcUrl);
    console.log('headers');
    this._initHeaders(headerListener);
    console.log('chain id');
    // this._chainId = await this._lunieApi.setChainId(); // TODO: replace deprecated call
    this._initialized = true;
  }

  public get query() {
    return this._lcdClient;
  }

  public async queryUrl(path: string, page = 1, limit = 30, recurse = true): Promise<any> {
    try {
      const url = this.restUrl + path;
      console.log(`query: ${url}, page: ${page}, limit: ${limit}`);
      let response = await $.get(url, { page, limit });

      // remove height wrappers
      if (response.height !== undefined && response.result !== undefined) {
        response = response.result;
      }

      if (recurse && response.length === limit) {
        const nextResults = await this.queryUrl(path, page + 1);
        return response + nextResults;
      }
      return response;
    } catch (err) {
      console.error(err);
    }
  }

  // e.g. 'MsgSend', 'MsgDelegate'
  public observeEvent(e: string, cb: (tx: ITx) => void | Promise<void>) {
    if (!this._eventHandlers[e]) {
      this._eventHandlers[e] = cb;
    }
  }

  private logTx(tx: any) {
    if (tx.type === 'auth/StdTx' || tx.type === 'cosmos-sdk/StdTx') {
      const txPrint = `std tx (fee: ${tx.value.fee.gas}): `;
      const msgs = tx.value.msg;
      for (const msg of msgs) {
        if (msg.type === 'cosmos-sdk/MsgSend') {
          console.log(`${txPrint}bank msg: send`);
        } else if (msg.type === 'cosmos-sdk/MsgMultiSend') {
          console.log(`${txPrint}bank msg: multisend`);
        } else if (msg.type === 'cosmos-sdk/MsgDelegate') {
          console.log(`${txPrint}staking msg: delegate`);
        } else if (msg.type === 'cosmos-sdk/MsgUndelegate') {
          console.log(`${txPrint}staking msg: undelegate`);
        } else if (msg.type === 'cosmos-sdk/MsgCreateValidator') {
          console.log(`${txPrint}staking msg: create validator`);
        } else if (msg.type === 'cosmos-sdk/MsgEditValidator') {
          console.log(`${txPrint}staking msg: edit validator`);
        } else if (msg.type === 'cosmos-sdk/MsgBeginRedelegate') {
          console.log(`${txPrint}staking msg: begin redelegate`);
        } else if (msg.type === 'cosmos-sdk/MsgSetWithdrawAddress') {
          console.log(`${txPrint}distribution msg: set withdraw address`);
        } else if (msg.type === 'cosmos-sdk/MsgWithdrawDelegationReward') {
          console.log(`${txPrint}distribution msg: withdraw delegator reward`);
        } else if (msg.type === 'cosmos-sdk/MsgWithdrawValidatorCommission') {
          console.log(`${txPrint}distribution msg: withdraw validator commission`);
        } else if (msg.type === 'cosmos-sdk/MsgSubmitProposal') {
          console.log(`${txPrint}governance msg: submit proposal`);
        } else if (msg.type === 'cosmos-sdk/MsgVote') {
          console.log(`${txPrint}governance msg: vote`);
        } else if (msg.type === 'cosmos-sdk/MsgDeposit') {
          console.log(`${txPrint}governance msg: deposit`);
        } else if (msg.type === 'cosmos-sdk/MsgUnjail') {
          console.log(`${txPrint}slashing msg: unjail`);
        } else {
          console.error(`got unknown tx type: ${msg.type}`);
        }
      }
    } else {
      console.error(`invalid tx type: ${tx.type}`);
    }
  }

  private _initHeaders(headerListener: (header: NewBlockHeaderEvent) => void) {
    this._newBlockHeaderSubscription = this._rpc.subscribeNewBlockHeader()
      .subscribe({ next: (e: NewBlockHeaderEvent) => {
        return headerListener(e);
      } });
    this._txSubscription = this._rpc.subscribeTx()
      .subscribe({ next: async (e) => {
        if (!e || !e.result || e.result.code !== undefined) {
          console.log('received invalid tx: ', e);
          return;
        }
        try {
          // TODO: confirm this is correct
          const AminoJs = await import('@tendermint/amino-js');
          const txJson: any = AminoJs.unmarshalTx(e.tx);
          this.logTx(txJson);
          // dispatch event to subscribers
          const memo = txJson.value.memo;
          txJson.value.msg.forEach((msg) => {
            const msgName = msg.type.split('/')[1];
            if (this._eventHandlers[msgName]) {
              this._eventHandlers[msgName]({ msg, events: e.result.events, memo });
            }
          });
        } catch (err) {
          console.error(`error: ${err.message} failed to unmarshal tx: `, err.TxResult && err.TxResult.tx);
        }
      } });
  }

  public deinit() {
    if (this._newBlockHeaderSubscription) {
      this._newBlockHeaderSubscription.unsubscribe();
      this._newBlockHeaderSubscription = undefined;
    }
    if (this._txSubscription) {
      this._txSubscription.unsubscribe();
      this._txSubscription = undefined;
    }
    for (const event of Object.keys(this._eventHandlers)) {
      delete this._eventHandlers[event];
    }
    this._initialized = false;
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
    const result = await this._lcdClient.auth.account(senderAddress);
    const { sequence, account_number: accountNumber } = result.result.value;
    const DEFAULT_GAS_PRICE = [{ amount: (2.5e-8).toFixed(9), denom: gasDenom }];
    const fee = { amount: DEFAULT_GAS_PRICE, gas: `${gas}` };
    const messageToSign = makeSignDoc([ msg ], fee, this.chainId, memo, sequence, accountNumber);
    return { msg, memo, fee, cmdData: { messageToSign, chainId: this.chainId, sequence, accountNumber, gas } };
  }
}
