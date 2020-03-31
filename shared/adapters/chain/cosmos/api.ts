import { Observable, Subject } from 'rxjs';
import * as $ from 'jquery';
import { default as _ } from 'lodash';
import { takeWhile } from 'rxjs/operators';

export interface ITxEvent {
  type: string;
  attributes: [
    {
      key: string;
      value: string;
    }
  ];
}

export interface ITx {
  msg: {
    type: string;
    value: any; // specific to the tx type
  };
  events: ITxEvent[];
  memo: string;
}

export class CosmosApi {
  private _lunieApi;
  private _rpc;
  private _eventHandlers: { [e: string]: Subject<ITx> } = {};
  private _chainId: string;
  private _initialized: boolean;
  public get chainId(): string {
    return this._chainId;
  }
  public readonly rpcUrl: string;
  public readonly restUrl: string;

  constructor(rpcUrl, restUrl) {
    this.rpcUrl = rpcUrl;
    this.restUrl = restUrl;
  }

  public async init(headerListener) {
    console.log('lunie api');
    this._lunieApi = new (await import('@lunie/cosmos-api')).default(this.restUrl);
    console.log('tendermint rpc');
    const Tendermint = await import('tendermint');
    this._rpc = Tendermint.RpcClient(this.rpcUrl);
    console.log('headers');
    this._initHeaders(headerListener);
    console.log('chain id');
    this._chainId = await this._lunieApi.setChainId();
    this._initialized = true;
  }

  public async queryUrl(path, page = 1, limit = 30, recurse = true): Promise<any> {
    try {
      const url = this.restUrl + path;
      console.log('query: ' + url + ', page: ' + page + ', limit: ' + limit);
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
  public observeEvent(e: string): Observable<ITx> {
    if (!this._eventHandlers[e]) {
      this._eventHandlers[e] = new Subject<ITx>();
    }
    return this._eventHandlers[e].asObservable().pipe(
      // this should automatically close the observables upon deinit
      takeWhile(() => this._initialized !== false)
    );
  }

  private logTx(tx: any) {
    if (tx.type === 'auth/StdTx' || tx.type === 'cosmos-sdk/StdTx') {
      const txPrint = `std tx (fee: ${tx.value.fee.gas}): `;
      const msgs = tx.value.msg;
      for (const msg of msgs) {
        if (msg.type === 'cosmos-sdk/MsgSend') {
          console.log(txPrint + 'bank msg: send');
        } else if (msg.type === 'cosmos-sdk/MsgMultiSend') {
          console.log(txPrint + 'bank msg: multisend');
        } else if (msg.type === 'cosmos-sdk/MsgDelegate') {
          console.log(txPrint + 'staking msg: delegate');
        } else if (msg.type === 'cosmos-sdk/MsgUndelegate') {
          console.log(txPrint + 'staking msg: undelegate');
        } else if (msg.type === 'cosmos-sdk/MsgCreateValidator') {
          console.log(txPrint + 'staking msg: create validator');
        } else if (msg.type === 'cosmos-sdk/MsgEditValidator') {
          console.log(txPrint + 'staking msg: edit validator');
        } else if (msg.type === 'cosmos-sdk/MsgBeginRedelegate') {
          console.log(txPrint + 'staking msg: begin redelegate');
        } else if (msg.type === 'cosmos-sdk/MsgSetWithdrawAddress') {
          console.log(txPrint + 'distribution msg: set withdraw address');
        } else if (msg.type === 'cosmos-sdk/MsgWithdrawDelegationReward') {
          console.log(txPrint + 'distribution msg: withdraw delegator reward');
        } else if (msg.type === 'cosmos-sdk/MsgWithdrawValidatorCommission') {
          console.log(txPrint + 'distribution msg: withdraw validator commission');
        } else if (msg.type === 'cosmos-sdk/MsgSubmitProposal') {
          console.log(txPrint + 'governance msg: submit proposal');
        } else if (msg.type === 'cosmos-sdk/MsgVote') {
          console.log(txPrint + 'governance msg: vote');
        } else if (msg.type === 'cosmos-sdk/MsgDeposit') {
          console.log(txPrint + 'governance msg: deposit');
        } else if (msg.type === 'cosmos-sdk/MsgUnjail') {
          console.log(txPrint + 'slashing msg: unjail');
        } else {
          console.error('got unknown tx type: ' + msg.type);
        }
      }
    } else {
      console.error('invalid tx type: ' + tx.type);
    }
  }

  private _initHeaders(headerListener) {
    this._rpc.subscribe({ query: 'tm.event = \'NewBlockHeader\''}, (e) => {
      //console.log(e);
      return headerListener(e.header);
    });
    this._rpc.subscribe({ query: 'tm.event = \'Tx\'' }, async (e) => {
      if (!e.TxResult || !e.TxResult.result || e.TxResult.result.code !== undefined) {
        console.log('received invalid tx: ', e);
        return;
      } else {
        //console.log('received valid tx: ', e);
      }
      const events = e.TxResult.result.events ? e.TxResult.result.events.map(({ type, attributes }) => {
        return {
          type, attributes: attributes.map(({ key, value }) => ({ key: key && atob(key), value: value && atob(value) }))
        };
      }) : [];
      try {
        const AminoJs = await import('@tendermint/amino-js');
        const txBytes = AminoJs.base64ToBytes(e.TxResult.tx);
        const txJson: any = AminoJs.unmarshalTx(txBytes);
        this.logTx(txJson);
        // dispatch event to subscribers
        const memo = txJson.value.memo;
        txJson.value.msg.forEach((msg) => {
          const msgName = msg.type.split('/')[1];
          if (this._eventHandlers[msgName]) {
            this._eventHandlers[msgName].next({ msg, events, memo });
          }
        });
      } catch (e) {
        console.error('error: ' + e.message + ' failed to unmarshal tx: ', e.TxResult && e.TxResult.tx);
      }
    });
  }

  public deinit() {
    this._rpc.unsubscribeAll();
    for (const event of Object.keys(this._eventHandlers)) {
      delete this._eventHandlers[event];
    }
    this._initialized = false;
  }

  get query() {
    return this._lunieApi.get;
  }

  public async tx(
    txName: string,
    senderAddress: string,
    args: object,
    memo: string = '',
    gas?: number,
    gasDenom: string = 'uatom',
  ) {
    const msg = this._lunieApi[txName](senderAddress, args);

    // estimate the needed gas amount
    if (!gas) {
      gas = await msg.simulate({ memo });
    }

    // generate unsigned version for CLI
    const { account_number: accountNumber, sequence } = await this._lunieApi.get.account(senderAddress);
    const DEFAULT_GAS_PRICE = [{ amount: (2.5e-8).toFixed(9), denom: gasDenom }];
    const messageToSign = (await import('@lunie/cosmos-api')).createStdTx({
      gas: '' + gas, gasPrices: DEFAULT_GAS_PRICE, memo
    }, msg.message);
    return { msg, memo, cmdData: { messageToSign, chainId: this.chainId, sequence, accountNumber, gas } };
  }
}
