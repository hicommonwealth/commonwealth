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

export class BinaryVote<C extends Coin> implements IVote<C> {
  public readonly account: IBalanceAccount<C>;
  public readonly choice: boolean;
  public readonly amount: number;
  public readonly weight: number;

  constructor(
    account: IBalanceAccount<C>,
    choice: boolean,
    amount?: number,
    weight?: number,
  ) {
    this.account = account;
    this.choice = choice;

    this.amount = amount;

    this.weight = weight;
  }
}
