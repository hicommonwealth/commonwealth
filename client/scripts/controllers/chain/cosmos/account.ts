import _ from 'lodash';
import { IApp } from 'state';
import { CosmosToken } from 'adapters/chain/cosmos/types';
import CosmosChain from 'controllers/chain/cosmos/chain';
import { Account, IAccountsModule } from 'models';
import { AccountsStore } from 'stores';

export interface ICosmosValidator {
  // TODO: add more properties (commission, unbonding, jailed, etc)
  // TODO: if we wanted, we could get all delegations to a validator, but is this necessary?
  pubkey: string;
  operator: string;
  tokens: number;
  description: any;
  status: CosmosValidatorState;
  isJailed: boolean;
}

export enum CosmosValidatorState {
  Unbonded = 'unbonded',
  Unbonding = 'unbonding',
  Bonded = 'bonded',
}

export class CosmosAccount extends Account<CosmosToken> {
  private _Chain: CosmosChain;
  private _Accounts: CosmosAccounts;

  // TODO: add delegations, validations
  private _privateKey: Buffer;
  private _publicKey: Buffer;

  private _validatorDelegations: { [address: string]: number } = {};
  public get validatorDelegations(): Promise<{ [address: string]: number }> {
    return this.updateValidatorDelegations();
  }

  private _delegations: { [address: string]: number } = {};
  public get delegations(): Promise<{ [address: string]: number }> {
    if (this._balance) {
      // console.log(this._balance.value.toCoinObject().amount);
      return this.updateDelegations();
    } else {
      return null;
    }
  }

  private _balance: CosmosToken;
  private _validatorStake: number;
  public get validatorStake(): number {
    return this._validatorStake;
  }

  constructor(
    app: IApp,
    ChainInfo: CosmosChain,
    Accounts: CosmosAccounts,
    address: string
  ) {
    super(app, app.chain.meta.chain, address);
    if (!app.isModuleReady) {
      // defer chain initialization
      app.chainModuleReady.once('ready', () => {
        if (app.chain.chain instanceof CosmosChain)
          this._Chain = app.chain.chain;
        else
          console.error('Did not successfully initialize account with chain');
      });
    } else {
      this._Chain = ChainInfo;
    }
    this._Accounts = Accounts;
    this._Accounts.store.add(this);
  }

  public setMnemonic(mnemonic: string) {
    const {
      cosmosAddress,
      privateKey,
      publicKey,
    } = this._Accounts.CosmosKeys.getNewWalletFromSeed(mnemonic);
    if (cosmosAddress !== this.address) {
      throw new Error('address does not match mnemonic');
    }
    this.mnemonic = mnemonic;
    this.setPrivateKey(privateKey);
    this.setPublicKey(publicKey);
  }
  public setSeed(seed: string) {
    const {
      cosmosAddress,
      privateKey,
      publicKey,
    } = this._Accounts.CosmosKeys.getNewWalletFromSeed(seed);
    if (cosmosAddress !== this.address) {
      throw new Error('address does not match mnemonic');
    }
    this.seed = seed;
    this.setPrivateKey(privateKey);
    this.setPublicKey(publicKey);
  }
  public setPrivateKey(pk: string) {
    this._privateKey = Buffer.from(pk, 'hex');
  }
  public setPublicKey(pubk: string) {
    this._publicKey = Buffer.from(pubk, 'hex');
  }
  get publicKey() {
    if (this._publicKey) {
      return this._publicKey.toString('hex');
    } else {
      return null;
    }
  }

  protected addressFromMnemonic(mnemonic: string): string {
    const {
      cosmosAddress,
      privateKey,
      publicKey,
    } = this._Accounts.CosmosKeys.getNewWalletFromSeed(mnemonic);
    return cosmosAddress;
  }
  protected addressFromSeed(seed: string): string {
    const {
      cosmosAddress,
      privateKey,
      publicKey,
    } = this._Accounts.CosmosKeys.getNewWalletFromSeed(seed);
    return cosmosAddress;
  }

  public getLedgerSigner() {
    if (!this._privateKey || !this._publicKey) {
      throw new Error('cannot sign transaction without public key');
    }
    return (signMessage: string) => ({
      signature: this._Accounts.CosmosKeys.signWithPrivateKey(
        signMessage,
        this._privateKey
      ),
      publicKey: this._publicKey,
    });
  }

  public async signMessage(message: string): Promise<string> {
    if (!this._privateKey) {
      throw new Error('Private key required to sign.');
    }
    return this._Accounts.CosmosKeys.signWithPrivateKey(
      message,
      this._privateKey
    ).toString('hex');
  }

  public updateValidatorDelegations = _.throttle(async () => {
    let resp;
    try {
      // @ Not sure if this is the query??
      resp = await this._Chain.api.query.validatorDelegations(this.address);
    } catch (e) {
      console.error(e);
    }
    // JSON incompatibilities...
    if (!resp) {
      console.error('could not update delegations');
      return;
    }
    const validatorDelegations = this._validatorDelegations;
    for (const validatorDelegation of resp) {
      validatorDelegations[
        validatorDelegations.delegate_address
      ] = +validatorDelegation.shares;
    }
    this._validatorDelegations = validatorDelegations;
    return validatorDelegations;
  });

  public updateDelegations = _.throttle(async () => {
    const queryUrl = `${this._Chain.api.restUrl}/staking/delegators/${this.address}/delegations`;
    let resp;
    try {
      resp = await this._Chain.api.query.delegations(this.address);
    } catch (e) {
      console.error(e);
    }
    // JSON incompatibilities...
    if (!resp) {
      console.error('could not update delegations');
      return;
    }
    const delegations = this._delegations;
    for (const delegation of resp) {
      delegations[delegation.validator_address] = +delegation.shares;
    }
    this._delegations = delegations;
    return delegations;
  });

  public get balance() {
    return this.updateBalance();
  }

  public updateBalance = _.throttle(async () => {
    // const queryUrl = this._Chain.api.restUrl + '/auth/accounts/' + this.address;
    let resp;
    try {
      resp = await this._Chain.api.query.account(this.address);
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
    if (resp && resp.coins && resp.coins[0]) {
      for (const coins of resp.coins) {
        const bal = +coins.amount;
        if (coins.denom === this._Chain.denom) {
          this._balance = this._Chain.coins(bal, true);
        } else if (coins.denom === 'validatortoken') {
          // TODO: add validator tokens to accounts
          this._validatorStake = +bal;
        } else {
          throw new Error(`invalid denomination: ${coins.denom}`);
        }
      }
      if (
        resp &&
        resp.public_key &&
        resp.public_key.type === 'tendermint/PubKeySecp256k1'
      ) {
        const pk = Buffer.from(resp.public_key.value, 'base64');
        this.setPublicKey(pk.toString('hex'));
      }
    }
    if (!this._balance) {
      console.log('no compatible denominations found');
      this._balance = this._Chain.coins(0);
    }
    return this._balance;
  });

  public sendBalanceTx(
    recipient: CosmosAccount,
    amount: CosmosToken,
    memo = ''
  ) {
    const args = {
      toAddress: recipient.address,
      amounts: [{ denom: amount.denom, amount: amount.toString() }],
    };
    const txFn = (gas: number) =>
      this._Chain.api.tx(
        'MsgSend',
        this.address,
        args,
        memo,
        gas,
        this._Chain.denom
      );
    return this._Chain.createTXModalData(
      this,
      txFn,
      'MsgSend',
      `${this.address} sent ${amount.format()} to ${recipient.address}`
      // (success: boolean) => {
      //   if (success) {
      //     this.updateBalance();
      //     recipient.updateBalance();
      //   }
      // },
    );
  }

  public delegateTx(validatorAddress: string, amount: CosmosToken, memo = '') {
    const args = {
      validatorAddress,
      amount: amount.toString(),
      denom: amount.denom,
    };
    const txFn = (gas: number) =>
      this._Chain.api.tx(
        'MsgDelegate',
        this.address,
        args,
        memo,
        gas,
        this._Chain.denom
      );
    return this._Chain.createTXModalData(
      this,
      txFn,
      'MsgDelegate',
      `${this.address} delegated ${amount.format()} to ${validatorAddress}`
    );
  }

  public undelegateTx(
    validatorAddress: string,
    amount: CosmosToken,
    memo = ''
  ) {
    const args = {
      validatorAddress,
      amount: amount.toString(),
      denom: amount.denom,
    };
    const txFn = (gas: number) =>
      this._Chain.api.tx(
        'MsgUndelegate',
        this.address,
        args,
        memo,
        gas,
        this._Chain.denom
      );
    return this._Chain.createTXModalData(
      this,
      txFn,
      'MsgUndelegate',
      `${this.address} undelegated ${amount.format()} from ${validatorAddress}`
    );
  }

  public redelegateTx(
    validatorSource: string,
    validatorDest: string,
    amount: CosmosToken,
    memo = ''
  ) {
    const args = {
      validatorSourceAddress: validatorSource,
      validatorDestinationAddress: validatorDest,
      amount: amount.toString(),
      denom: amount.denom,
    };
    const txFn = (gas: number) =>
      this._Chain.api.tx(
        'MsgRedelegate',
        this.address,
        args,
        memo,
        gas,
        this._Chain.denom
      );
    return this._Chain.createTXModalData(
      this,
      txFn,
      'MsgRedelegate',
      `${
        this.address
      } redelegated ${amount.format()} from ${validatorSource} to ${validatorDest}`
    );
  }

  public withdrawDelegationRewardTx(validatorAddress: string, memo = '') {
    const args = { validatorAddress };
    const txFn = (gas: number) =>
      this._Chain.api.tx(
        'MsgWithdrawDelegationReward',
        this.address,
        args,
        memo,
        gas,
        this._Chain.denom
      );
    return this._Chain.createTXModalData(
      this,
      txFn,
      'MsgDelegate',
      `${this.address} withdrew reward from ${validatorAddress}`
    );
  }
}

export class CosmosAccounts
  implements IAccountsModule<CosmosToken, CosmosAccount> {
  private _initialized = false;
  public get initialized() {
    return this._initialized;
  }

  // STORAGE
  private _store: AccountsStore<CosmosAccount> = new AccountsStore();
  public get store() {
    return this._store;
  }

  private _Chain: CosmosChain;

  public get(address: string) {
    return this.fromAddress(address);
  }

  private _validators: { [address: string]: ICosmosValidator } = {};
  public get validators(): { [address: string]: ICosmosValidator } {
    return this._validators;
  }

  private _app: IApp;
  public get app() {
    return this._app;
  }

  constructor(app: IApp) {
    this._app = app;
  }

  public CosmosKeys;

  public updateValidators = _.throttle(async () => {
    const bonded = await this._Chain.api.queryUrl(
      '/staking/validators?status=bonded',
      null,
      null,
      false
    );
    for (const validator of bonded) {
      this._validators[validator.consensus_pubkey] = {
        pubkey: validator.consensus_pubkey,
        operator: validator.operator_address,
        tokens: validator.tokens,
        description: validator.description,
        status: validator.status,
        isJailed: validator.jailed,
      };
    }

    const unbonded = await this._Chain.api.queryUrl(
      '/staking/validators?status=unbonded',
      null,
      null,
      false
    );
    for (const validator of unbonded) {
      this._validators[validator.consensus_pubkey] = {
        pubkey: validator.consensus_pubkey,
        operator: validator.operator_address,
        tokens: validator.tokens,
        description: validator.description,
        status: validator.status,
        isJailed: validator.jailed,
      };
    }
  });

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

  public fromMnemonic(mnemonic: string) {
    const {
      cosmosAddress,
      privateKey,
      publicKey,
    } = this.CosmosKeys.getNewWalletFromSeed(mnemonic);
    const acct = new CosmosAccount(this.app, this._Chain, this, cosmosAddress);
    acct.setMnemonic(mnemonic);
    acct.setPublicKey(publicKey);
    acct.setPrivateKey(privateKey);
    return acct;
  }
  public fromSeed(seed: string) {
    const {
      cosmosAddress,
      privateKey,
      publicKey,
    } = this.CosmosKeys.getNewWalletFromSeed(seed);
    const acct = new CosmosAccount(this.app, this._Chain, this, cosmosAddress);
    acct.setSeed(seed);
    acct.setPublicKey(publicKey);
    acct.setPrivateKey(privateKey);
    return acct;
  }

  public deinit() {
    this._initialized = false;
    this.store.clear();
  }

  public async init(ChainInfo: CosmosChain): Promise<void> {
    this._Chain = ChainInfo;
    this.CosmosKeys = await import('@lunie/cosmos-keys');
    // handle account-related events
    this._Chain.api.observeEvent('MsgSend', async ({ msg }) => {
      const sent = msg.value;
      const from = sent.from_address;
      const to = sent.to_address;
      const amt = sent.amount;
      console.log(
        `${amt[0].amount} ${amt[0].denom} sent from ${from} to ${to}`
      );
      let acc = this.fromAddressIfExists(from);
      if (acc) await acc.updateBalance();
      acc = this.fromAddressIfExists(to);
      if (acc) await acc.updateBalance();
    });
    this._Chain.api.observeEvent('MsgMultiSend', async ({ msg }) => {
      const inputs = msg.value.inputs;
      const outputs = msg.value.outputs;
      for (const { address } of inputs.concat(outputs)) {
        const acc = this.fromAddressIfExists(address);
        if (acc) await acc.updateBalance();
      }
    });
    this._Chain.api.observeEvent('MsgDelegate', async ({ msg }) => {
      const acc = this.fromAddressIfExists(
        (msg.value as any).delegator_address
      );
      if (acc) await acc.updateBalance();
      if (acc) await acc.updateDelegations();
    });
    this._Chain.api.observeEvent('MsgUndelegate', async ({ msg }) => {
      const acc = this.fromAddressIfExists(
        (msg.value as any).delegator_address
      );
      if (acc) await acc.updateBalance();
      if (acc) await acc.updateDelegations();
    });
    this._Chain.api.observeEvent(
      'MsgWithdrawDelegationReward',
      async ({ msg }) => {
        const acc = this.fromAddressIfExists(
          (msg.value as any).delegator_address
        );
        if (acc) await acc.updateBalance();
      }
    );
    this._Chain.api.observeEvent('MsgBeginRedelegate', async ({ msg }) => {
      const acc = this.fromAddressIfExists(
        (msg.value as any).delegator_address
      );
      if (acc) await acc.updateDelegations();
    });

    // TODO: validator-related events
    // TODO: separate active from jailed/unbonded
    // Do not recurse -- validators query does not support pagination.
    const bonded = await this._Chain.api.queryUrl(
      '/staking/validators?status=bonded',
      null,
      null,
      false
    );
    for (const validator of bonded) {
      this._validators[validator.consensus_pubkey] = {
        pubkey: validator.consensus_pubkey,
        operator: validator.operator_address,
        tokens: validator.tokens,
        description: validator.description,
        status: validator.status,
        isJailed: validator.jailed,
      };
    }

    const unbonded = await this._Chain.api.queryUrl(
      '/staking/validators?status=unbonded',
      null,
      null,
      false
    );
    for (const validator of unbonded) {
      this._validators[validator.consensus_pubkey] = {
        pubkey: validator.consensus_pubkey,
        operator: validator.operator_address,
        tokens: validator.tokens,
        description: validator.description,
        status: validator.status,
        isJailed: validator.jailed,
      };
    }

    this._initialized = true;
  }
}
