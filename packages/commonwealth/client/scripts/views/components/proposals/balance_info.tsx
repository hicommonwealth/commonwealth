/* @jsx m */

import { formatCoin } from 'adapters/currency';
import ClassComponent from 'class_component';
import m from 'mithril';
import app from 'state';
import { CWText } from '../component_kit/cw_text';
import AddressAccount from "models/AddressAccount";
import SubstrateChain from "controllers/chain/substrate/shared";
import {IChainAdapter} from "models";
import {SubstrateCoin} from "adapters/chain/substrate/types";

type BalanceInfoAttrs = {
  account: AddressAccount;
};

export class BalanceInfo extends ClassComponent<BalanceInfoAttrs> {
  private balance: any;
  private freeBalance: any;
  private lockedBalance: any;

  oninit(vnode: m.Vnode<BalanceInfoAttrs>) {
    const { account } = vnode.attrs;

    app.runWhenReady(async () => {
      if (app.chain.chain instanceof SubstrateChain) {
        this.balance = await app.chain.chain.getBalance(account);
        this.lockedBalance = await app.chain.chain.getLockedBalance(account);
        this.freeBalance = await app.chain.chain.getFreeBalance(account);
      }
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
