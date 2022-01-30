import _ from 'lodash';
import BN from 'bn.js';
import { IApp } from 'state';
import CosmosChain from 'controllers/chain/cosmos/chain';
import { CosmosToken } from 'controllers/chain/cosmos/types';
import { Account, ITXModalData } from 'models';
import {
  MsgSendEncodeObject,
  MsgDelegateEncodeObject,
  MsgUndelegateEncodeObject,
  MsgWithdrawDelegatorRewardEncodeObject,
} from '@cosmjs/stargate';
import CosmosAccounts from './accounts';

export default class CosmosAccount extends Account<CosmosToken> {
  private _Chain: CosmosChain;
  private _Accounts: CosmosAccounts;

  // TODO: add delegations, validations
  private _balance: CosmosToken;
  public get balance() { return this.updateBalance().then(() => this._balance); }

  constructor(app: IApp, ChainInfo: CosmosChain, Accounts: CosmosAccounts, address: string) {
    super(app, app.chain.meta.chain, address);
    if (!app.isModuleReady) {
      // defer chain initialization
      app.chainModuleReady.once('ready', () => {
        if (app.chain.chain instanceof CosmosChain) this._Chain = app.chain.chain;
        else console.error('Did not successfully initialize account with chain');
      });
    } else {
      this._Chain = ChainInfo;
    }
    this._Accounts = Accounts;
    this._Accounts.store.add(this);
  }

  public updateBalance = _.throttle(async () => {
    try {
      const bal = await this._Chain.api.bank.balance(this.address, this._Chain.denom);
      this._balance = this._Chain.coins(new BN(bal.amount));
    } catch (e) {
      // if coins is null, they have a zero balance
      console.log(`no balance found: ${e.message}`);
      this._balance = this._Chain.coins(0);
    }
  });

  public async sendTx(recipient: CosmosAccount, amount: CosmosToken) {
    const msg: MsgSendEncodeObject = {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        fromAddress: this.address,
        toAddress: recipient.address,
        amount: [ { denom: amount.denom, amount: amount.toString() } ],
      }
    };
    await this._Chain.sendTx(this, msg);
  }

  public async delegateTx(validatorAddress: string, amount: CosmosToken) {
    const msg: MsgDelegateEncodeObject = {
      typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
      value: {
        delegatorAddress: this.address,
        validatorAddress,
        amount: amount.toCoinObject(),
      }
    };
    await this._Chain.sendTx(this, msg);
  }

  public async undelegateTx(validatorAddress: string, amount: CosmosToken) {
    const msg: MsgUndelegateEncodeObject = {
      typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
      value: {
        delegatorAddress: this.address,
        validatorAddress,
        amount: amount.toCoinObject(),
      }
    };
    await this._Chain.sendTx(this, msg);
  }

  public async withdrawDelegationRewardTx(validatorAddress: string) {
    const msg: MsgWithdrawDelegatorRewardEncodeObject = {
      typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
      value: {
        delegatorAddress: this.address,
        validatorAddress,
      }
    };
    await this._Chain.sendTx(this, msg);
  }
}
