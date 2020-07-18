import app from 'state';
import m from 'mithril';
import { ChainBase } from 'models';
import Substrate from 'controllers/chain/substrate/main';
import { makeDynamicComponent } from 'models/mithril';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { formatBalance, BN_TEN, BN_ZERO } from '@polkadot/util';
import { SiDef } from '@polkadot/util/types';
import { DeriveBalancesAll } from '@polkadot/api-derive/types';
import BN from 'bn.js';

interface ValidateAmountState {
  dynamic: {
    allBalances: DeriveBalancesAll
  }
}

interface ValidateAmountAttrs {
  controller: SubstrateAccount,
  amount: BN,
  si: SiDef,
  onError(isFatal: boolean): void
}

function getValuesFromBn(valueBn: BN, si: SiDef | null): BN {
  const value = si
    ? valueBn.mul(BN_TEN.pow(new BN(formatBalance.getDefaults().decimals + si.power))).toString()
    : valueBn.toString();

  return new BN(value);
}
const ValidateAmount = makeDynamicComponent<ValidateAmountAttrs, ValidateAmountState>({
  getObservables: (attrs) => ({
    groupKey:  attrs.controller.profile.address,
    allBalances: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.allBalances(attrs.controller.profile.address)
      : null
  }),
  view: (vnode) => {
    const { amount, si, onError } = vnode.attrs;
    const { allBalances } = vnode.state.dynamic;
    const value = getValuesFromBn(amount, si);
    if (allBalances && value) {
      if (value.gte(allBalances.freeBalance)) {
        onError(true);
        return m('p.error', `The specified value is too large and 
          does not allow funds to pay future transaction fees.`);
      }
    }
    onError(false);
    return null;
  }
});

export default ValidateAmount;
