import type { Coin } from 'adapters/currency';
import type { IBalanceAccount, IVote } from './interfaces';

export class DepositVote<C extends Coin> implements IVote<C> {
  public readonly account: IBalanceAccount<C>;
  public readonly deposit: C;

  constructor(account: IBalanceAccount<C>, deposit: C) {
    this.account = account;
    this.deposit = deposit;
  }
}
