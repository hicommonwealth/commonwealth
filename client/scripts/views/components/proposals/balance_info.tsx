/* @jsx m */

import m from 'mithril';

import { formatCoin } from 'adapters/currency';
import app from 'state';
import { SubstrateAccount } from 'controllers/chain/substrate/account';

export class BalanceInfo implements m.ClassComponent {
  private balance: any;
  private freeBalance: any;
  private lockedBalance: any;

  oninit(vnode) {
    app.runWhenReady(async () => {
      this.freeBalance = await (vnode.attrs.account as SubstrateAccount)
        .freeBalance;

      this.lockedBalance = await (vnode.attrs.account as SubstrateAccount)
        .lockedBalance;

      this.balance = await (vnode.attrs.account as SubstrateAccount).balance;

      m.redraw();
    });
  }

  view() {
    return (
      <div class="BalanceInfo" style="font-size: 90%;">
        <div>
          {`Free: ${this.freeBalance ? formatCoin(this.freeBalance) : '--'}`}
        </div>
        <div>
          {`Locked: ${
            this.lockedBalance ? formatCoin(this.lockedBalance) : '--'
          }`}
        </div>
        <div>{`Total: ${this.balance ? formatCoin(this.balance) : '--'}`}</div>
      </div>
    );
  }
}
