import app from 'state';
import m from 'mithril';
import { ChainBase } from 'models';
import Substrate from 'controllers/chain/substrate/main';
import { makeDynamicComponent } from 'models/mithril';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { Option } from '@polkadot/types';
import { AccountId, StakingLedger, } from '@polkadot/types/interfaces';
import { DeriveBalancesAll } from '@polkadot/api-derive/types';

interface ValidateControllerAttrs {
  stash: SubstrateAccount,
  controller: SubstrateAccount,
  onError(isFatal: boolean): void,
}

interface ValidateControllerState {
  dynamic: {
    ledger: Option<StakingLedger>,
    bonded: Option<AccountId>,
    allBalances: DeriveBalancesAll
  }
}

const ValidateController = makeDynamicComponent<ValidateControllerAttrs, ValidateControllerState>({
  getObservables: (attrs) => ({
    groupKey:  attrs.controller.profile.address,
    ledger: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.ledger(attrs.controller.profile.address)
      : null,
    bonded: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.bonded(attrs.controller.profile.address)
      : null,
    allBalances: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.allBalances(attrs.controller.profile.address)
      : null
  }),
  view: (vnode) => {
    const { bonded, ledger, allBalances } = vnode.state.dynamic;
    const { controller, stash, onError } = vnode.attrs;

    if (!bonded && !ledger)
      return null;
    const bondedId = bonded.isSome
      ? bonded.unwrap().toString()
      : null;
    const stashId = ledger.isSome
      ? ledger.unwrap().stash.toString()
      : null;

    let newError: string | null = null;
    let isFatal = false;
    if (bondedId) {
      isFatal = true;
      newError = `A controller account should not map to another stash. 
      This selected controller is a stash, controlled by ${bondedId}`;
    } else if (stashId) {
      isFatal = true;
      newError = `A controller account should not be set to manage multiple stashes. 
      The selected controller is already controlling ${stashId}`;
    } else if (allBalances?.freeBalance.isZero()) {
      isFatal = true;
      newError = `The controller does no have sufficient funds available to cover transaction fees. 
      Ensure that a funded controller is used.`;
    } else if (controller === stash) {
      newError = `Distinct stash and controller accounts are recommended to ensure fund security. 
      You will be allowed to make the transaction, but take care to not tie up all funds, 
      only use a portion of the available funds during this period.`;
    }
    onError(isFatal);
    if (!newError)
      return null;
    return m(`p.${isFatal ? 'error' : 'warning'}`, newError);
  }
});

export default ValidateController;
