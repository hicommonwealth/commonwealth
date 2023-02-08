import React from 'react';

import { ClassComponent, ResultNode, redraw} from

 'mithrilInterop';

import { formatCoin } from 'adapters/currency';
import type { SubstrateAccount } from 'controllers/chain/substrate/account';
import app from 'state';
import { CWText } from '../component_kit/cw_text';

type BalanceInfoAttrs = {
  account: SubstrateAccount;
};

export class BalanceInfo extends ClassComponent<BalanceInfoAttrs> {
  private balance: any;
  private freeBalance: any;
  private lockedBalance: any;

  oninit(vnode: ResultNode<BalanceInfoAttrs>) {
    const { account } = vnode.attrs;

    app.runWhenReady(async () => {
      this.freeBalance = await account.freeBalance;

      this.lockedBalance = await account.lockedBalance;

      this.balance = await account.balance;

      redraw();
    });
  }

  view() {
    return (
      <React.Fragment>
        <CWText>
          Free: {this.freeBalance ? formatCoin(this.freeBalance) : '--'}
        </CWText>
        <CWText>
          Locked: {this.lockedBalance ? formatCoin(this.lockedBalance) : '--'}
        </CWText>
        <CWText>Total: {this.balance ? formatCoin(this.balance) : '--'}</CWText>
      </React.Fragment>
    );
  }
}
