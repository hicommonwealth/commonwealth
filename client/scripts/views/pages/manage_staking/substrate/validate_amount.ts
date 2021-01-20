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
  amount: string,
  si: SiDef,
  onError(isFatal: boolean): void
}

function getSiPowers(si: SiDef | null): [BN, number, number] {
  if (!si) {
    return [BN_ZERO, 0, 0];
  }

  const basePower = formatBalance.getDefaults().decimals;

  return [new BN(basePower + si.power), basePower, si.power];
}

export function getValuesFromBn(input: string, si: SiDef | null): BN {
  const [siPower, basePower, siUnitPower] = getSiPowers(si);
  let result = new BN(0);
  const isDecimalValue = input.match(/^(\d+)\.(\d+)$/);

  if (isDecimalValue) {
    if (siUnitPower - isDecimalValue[2].length < -basePower) {
      result = new BN(-1);
    }

    const div = new BN(input.replace(/\.\d*$/, ''));
    const modString = input.replace(/^\d+\./, '');
    const mod = new BN(modString);

    result = div
      .mul(BN_TEN.pow(siPower))
      .add(mod.mul(BN_TEN.pow(new BN(basePower + siUnitPower - modString.length))));
  } else {
    result = new BN(input.replace(/[^\d]/g, ''))
      .mul(BN_TEN.pow(siPower));
  }

  return result;
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
