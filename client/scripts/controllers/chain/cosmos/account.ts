import _ from 'lodash';
import BN from 'bn.js';
import { IApp } from 'state';
import CosmosChain from 'controllers/chain/cosmos/chain';
import { CosmosToken } from 'controllers/chain/cosmos/types';
import { Account, IAccountsModule, ITXModalData } from 'models';
import { AccountsStore } from 'stores';
import { AuthAccountsResponse } from '@cosmjs/launchpad';
import {
  MsgSendEncodeObject,
  MsgDelegateEncodeObject,
  MsgUndelegateEncodeObject,
  MsgWithdrawDelegatorRewardEncodeObject,
} from '@cosmjs/stargate';
import { BondStatus } from '@cosmjs/launchpad/build/lcdapi/staking';

export interface ICosmosValidator {
  // TODO: add more properties (commission, unbonding, jailed, etc)
  // TODO: if we wanted, we could get all delegations to a validator, but is this necessary?
  pubkey: string;
  operator: string;
  tokens: CosmosToken;
  description: any;
  status: BondStatus;
  isJailed: boolean;
}

export class CosmosAccount extends Account<CosmosToken> {
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

  protected async addressFromMnemonic(mnemonic: string): Promise<string> {
    throw new Error('unsupported');
  }

  protected async addressFromSeed(seed: string): Promise<string> {
    throw new Error('unsupported');
  }

  public async signMessage(message: string): Promise<string> {
    throw new Error('unsupported');
  }

  public updateBalance = _.throttle(async () => {
    let resp: AuthAccountsResponse;
    try {
      resp = await this._Chain.api.auth.account(this.address);
    } catch (e) {
      // if coins is null, they have a zero balance
      console.log(`no balance found: ${JSON.stringify(e)}`);
      this._balance = this._Chain.coins(0);
    }
    // JSON incompatibilities...
    if (!resp) {
      console.error('could not update balance');
      return;
    }
    if (resp && resp.result.value.coins && resp.result.value.coins[0]) {
      for (const coins of resp.result.value.coins) {
        const bal = new BN(coins.amount);
        if (coins.denom === this._Chain.denom) {
          this._balance = this._Chain.coins(bal, true);
        } else {
          console.log(`found invalid denomination: ${coins.denom}`);
        }
      }
    }
    if (!this._balance) {
      console.log('no compatible denominations found');
      this._balance = this._Chain.coins(0);
    }
    return this._balance;
  });

  public sendBalanceTx(recipient: Account<CosmosToken>, amount: CosmosToken):
    ITXModalData | Promise<ITXModalData> {
    throw new Error('Method not implemented.');
  }

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

export class CosmosAccounts implements IAccountsModule<CosmosToken, CosmosAccount> {
  private _initialized: boolean = false;
  public get initialized() { return this._initialized; }

  // STORAGE
  private _store: AccountsStore<CosmosAccount> = new AccountsStore();
  public get store() { return this._store; }

  private _Chain: CosmosChain;

  public get(address: string) {
    return this.fromAddress(address);
  }

  private _app: IApp;
  public get app() { return this._app; }

  constructor(app: IApp) {
    this._app = app;
  }

  public fromAddress(address: string): CosmosAccount {
    // accepts bech32 encoded cosmosxxxxx addresses and not cosmospubxxx
    let acct;
    try {
      acct = this._store.getByAddress(address);
    } catch (e) {
      acct = new CosmosAccount(this.app, this._Chain, this, address);
    }
    return acct;
  }

  public fromAddressIfExists(address: string): CosmosAccount | null {
    try {
      return this._store.getByAddress(address);
    } catch (e) {
      return null;
    }
  }

  public deinit() {
    this._initialized = false;
    this.store.clear();
  }

  public async init(ChainInfo: CosmosChain): Promise<void> {
    this._Chain = ChainInfo;
    this._initialized = true;
  }
}
