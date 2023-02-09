import {Account} from "models";
import {SubstrateCoin} from "adapters/chain/substrate/types";
import {Balance, BalanceLock, BalanceLockTo212, EraIndex, Exposure, StakingLedger} from "@polkadot/types/interfaces";
import SubstrateChain from "controllers/chain/substrate/shared";
import {IApp} from "state";
import {ApiPromise} from "@polkadot/api";
import SubstrateAccounts from "controllers/chain/substrate/accounts";

export class SubstrateAccount extends Account {
  // GETTERS AND SETTERS
  // staking
  public get stakedBalance(): Promise<SubstrateCoin> {
    if (!this._Chain?.apiInitialized) return;
    return this.stakingExposure.then((exposure) =>
      this._Chain.coins(exposure ? exposure.total.toBn() : NaN)
    );
  }

  // The total balance
  public get balance(): Promise<SubstrateCoin> {
    if (!this._Chain?.apiInitialized) return;
    return this._Chain.api.derive.balances
      .all(this.address)
      .then(({ freeBalance, reservedBalance }) =>
        this._Chain.coins(freeBalance.add(reservedBalance))
      );
  }

  // The quantity of unlocked balance
  // TODO: note that this uses `availableBalance` and not `freeBalance` here -- this is because freeBalance
  //   only includes subtracted reserves, and not locks! And we want to see free for usage now.
  public get freeBalance(): Promise<SubstrateCoin> {
    if (!this._Chain?.apiInitialized) return;
    return this._Chain.api.derive.balances
      .all(this.address)
      .then(({ availableBalance }) => this._Chain.coins(availableBalance));
  }

  public get lockedBalance(): Promise<SubstrateCoin> {
    if (!this._Chain?.apiInitialized) return;
    return (
      this._Chain.api.derive.balances
        .all(this.address)
        // we compute illiquid balance by doing (total - available), because there's no query
        // or parameter to fetch it
        .then(({ availableBalance, votingBalance }) =>
          this._Chain.coins(votingBalance.sub(availableBalance))
        )
    );
  }

  // The coin locks this account has on them
  public get locks(): Promise<(BalanceLock | BalanceLockTo212)[]> {
    if (!this._Chain?.apiInitialized) return;
    return this._Chain.api.derive.balances
      .all(this.address)
      .then(({ lockedBreakdown }) =>
        lockedBreakdown.length > 0 ? lockedBreakdown : []
      );
  }

  // The amount staked by this account & accounts who have nominated it
  public get stakingExposure(): Promise<Exposure> {
    if (!this._Chain?.apiInitialized) return;
    return this._Chain.api.query.staking
      .currentEra<EraIndex>()
      .then((era: EraIndex) => {
        // Different runtimes call for different access to stakers: old vs. new
        const stakersCall = this._Chain.api.query.staking.stakers
          ? this._Chain.api.query.staking.stakers
          : this._Chain.api.query.staking.erasStakers;
        // Different staking functions call for different function arguments: old vs. new
        const stakersCallArgs = (account) =>
          this._Chain.api.query.staking.stakers
            ? [account]
            : [era.toString(), account];
        return stakersCall(
          ...stakersCallArgs(this.address)
        ) as Promise<Exposure>;
      });
  }

  public get bonded(): Promise<SubstrateAccount> {
    if (!this._Chain?.apiInitialized) return;
    return this._Chain.api.query.staking
      .bonded(this.address)
      .then((accountId) => {
        if (accountId && accountId.isSome) {
          return this._Accounts.fromAddress(accountId.unwrap().toString());
        } else {
          return null;
        }
      });
  }

  public get stakingLedger(): Promise<StakingLedger> {
    if (!this._Chain?.apiInitialized) return;
    return this._Chain.api.query.staking.ledger(this.address).then((ledger) => {
      if (ledger && ledger.isSome) {
        return ledger.unwrap();
      } else {
        return null;
      }
    });
  }

  // Accounts may delegate their voting power for democracy referenda. This always incurs the maximum locktime
  public get delegation(): Promise<[SubstrateAccount, number]> {
    if (!this._Chain?.apiInitialized) return;
    // we have to hack around the type here because of the linked_map wrapper
    return this._Chain.api.query.democracy
      .delegations<Delegation[]>(this.address)
      .then(([delegation]: [Delegation]) => {
        const [delegatedTo, conviction] = delegation;
        if (delegatedTo.isEmpty || delegatedTo.toString() === this.address) {
          return null;
        } else {
          // console.log('set delegation for acct: ' + this.address);
          return [
            this._Accounts.fromAddress(delegatedTo.toString()),
            conviction.index,
          ];
        }
      });
  }

  private _Chain: SubstrateChain;

  private _Accounts: SubstrateAccounts;

  public readonly isEd25519: boolean;

  // CONSTRUCTORS
  constructor(
    app: IApp,
    ChainInfo: SubstrateChain,
    Accounts: SubstrateAccounts,
    address: string,
    isEd25519 = false
  ) {
    if (!app.isModuleReady) {
      // defer chain initialization
      super({ chain: app.chain.meta, address });
      app.chainModuleReady.once('ready', () => {
        if (app.chain.chain instanceof SubstrateChain) {
          this._Chain = app.chain.chain;
        } else {
          console.error('Did not successfully initialize account with chain');
        }
      });
    } else {
      super({ chain: app.chain.meta, address });
      this._Chain = ChainInfo;
    }
    this.isEd25519 = isEd25519;
    this._Accounts = Accounts;
    this._Accounts.store.add(this);
  }

  // TRANSACTIONS
  public get balanceTransferFee(): Promise<SubstrateCoin> {
    const txFee = this._Chain.api.consts.balances.transferFee as Balance;
    if (txFee) return Promise.resolve(this._Chain.coins(txFee));
    const dummyTxFunc = (api: ApiPromise) =>
      api.tx.balances.transfer(this.address, '0');
    return this._Chain.computeFees(this.address, dummyTxFunc);
  }

  public nominateTx(nominees: SubstrateAccount[]) {
    return this._Chain.createTXModalData(
      this,
      (api: ApiPromise) =>
        api.tx.staking.nominate(nominees.map((n) => n.address)),
      'nominate',
      `${this.address} updates nominations`
    );
  }

  public chillTx() {
    return this._Chain.createTXModalData(
      this,
      (api: ApiPromise) => api.tx.staking.chill(),
      'chill',
      `${this.address} is chilling`
    );
  }

  public bondTx(
    controller: SubstrateAccount,
    amount: SubstrateCoin,
    rewardDestination: number | string
  ) {
    return this._Chain.createTXModalData(
      this,
      (api: ApiPromise) =>
        api.tx.staking.bond(
          controller.address,
          amount,
          this._Chain.createType('RewardDestination', rewardDestination)
        ),
      'bond',
      `${this.address} bonds ${amount.toString()} to controller ${
        controller.address
      }`
    );
  }

  public bondExtraTx(amount: SubstrateCoin) {
    return this._Chain.createTXModalData(
      this,
      (api: ApiPromise) => api.tx.staking.bondExtra(amount),
      'bondExtra',
      `${this.address} bonds additional ${amount.toString()}`
    );
  }

  public unbond(amount: SubstrateCoin) {
    return this._Chain.createTXModalData(
      this,
      (api: ApiPromise) => api.tx.staking.unbond(amount),
      'unbond',
      `${this.address} unbonds ${amount.toString()}`
    );
  }

  public setController(controller: SubstrateAccount) {
    return this._Chain.createTXModalData(
      this,
      (api: ApiPromise) => api.tx.staking.setController(controller.address),
      'setController',
      `${this.address} sets controller ${controller.address}`
    );
  }

  public setPayee(rewardDestination: number | string) {
    return this._Chain.createTXModalData(
      this,
      (api: ApiPromise) =>
        api.tx.staking.setPayee(
          this._Chain.createType('RewardDestination', rewardDestination)
        ),
      'setPayee',
      `${this.address} sets reward destination ${rewardDestination}`
    );
  }

  public unlockTx() {
    return this._Chain.createTXModalData(
      this,
      (api: ApiPromise) => api.tx.democracy.unlock(this.address),
      'unlock',
      `${this.address} attempts to unlock from democracy`
    );
  }
}
