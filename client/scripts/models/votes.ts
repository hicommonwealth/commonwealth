import { Coin } from 'adapters/currency';
import { IVote } from './interfaces';
import Account from './Account';

export class DepositVote<C extends Coin> implements IVote<C> {
  public readonly account: Account<C>;
  public readonly deposit: C;
  constructor(account: Account<C>, deposit: C) {
    this.account = account;
    this.deposit = deposit;
  }
}

export class BinaryVote<C extends Coin> implements IVote<C> {
  public readonly account: Account<C>;
  public readonly choice: boolean;
  public readonly weight: number;
  constructor(account: Account<C>, choice: boolean, weight?: number) {
    this.account = account;
    this.choice = choice;
    this.weight = weight;
  }
}
