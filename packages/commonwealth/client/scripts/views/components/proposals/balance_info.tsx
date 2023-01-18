/* @jsx m */

import { formatCoin } from 'adapters/currency';
import ClassComponent from 'class_component';
import type { SubstrateAccount } from 'controllers/chain/substrate/account';
import m from 'mithril';
import app from 'state';
import { CWText } from '../component_kit/cw_text';

type BalanceInfoAttrs = {
  account: SubstrateAccount;
};

export class BalanceInfo extends ClassComponent<BalanceInfoAttrs> {
  private balance: any;
  private freeBalance: any;
  private lockedBalance: any;

  oninit(vnode: m.Vnode<BalanceInfoAttrs>) {
    const { account } = vnode.attrs;

    app.runWhenReady(async () => {
      this.freeBalance = await account.freeBalance;

      this.lockedBalance = await account.lockedBalance;

      this.balance = await account.balance;

      m.redraw();
    });
  }

  view() {
    return (
      <>
        <CWText>
          Free: {this.freeBalance ? formatCoin(this.freeBalance) : '--'}
        </CWText>
        <CWText>
          Locked: {this.lockedBalance ? formatCoin(this.lockedBalance) : '--'}
        </CWText>
        <CWText>Total: {this.balance ? formatCoin(this.balance) : '--'}</CWText>
      </>
    );
  }
}
