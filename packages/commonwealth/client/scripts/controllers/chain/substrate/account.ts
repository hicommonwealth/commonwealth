import {Account} from "models";
import {SubstrateCoin} from "adapters/chain/substrate/types";
import {Balance, BalanceLock, BalanceLockTo212, EraIndex, Exposure, StakingLedger} from "@polkadot/types/interfaces";
import SubstrateChain from "controllers/chain/substrate/shared";
import {IApp} from "state";
import {ApiPromise} from "@polkadot/api";
import SubstrateAccounts from "controllers/chain/substrate/accounts";

export class SubstrateAccount extends Account {
  // GETTERS AND SETTERS

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
}
