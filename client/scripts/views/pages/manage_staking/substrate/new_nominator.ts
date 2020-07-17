import m from 'mithril';
import app from 'state';
import { formatAddressShort } from 'helpers';
import Substrate from 'controllers/chain/substrate/main';
import { makeDynamicComponent } from 'models/mithril';
import User from 'views/components/widgets/user';
import { IValidators, SubstrateAccount } from 'controllers/chain/substrate/account';
import { ICosmosValidator } from 'controllers/chain/cosmos/account';
import { StakingLedger } from '@polkadot/types/interfaces';
import StashAccountForm from 'views/pages/validators/substrate/stash_form';
import ControllerAccountForm from 'views/pages/validators/substrate/controller_form';
import Bond from 'views/pages/manage_staking/substrate/bond';

interface NewNominatorState {
  dynamic: {
  }
}

interface NewNominatorAttrs {
}

const NewNominator = makeDynamicComponent<NewNominatorAttrs, NewNominatorState>({
  getObservables: () => ({
    groupKey: app.chain.class.toString()
  }),
  view: (vnode) => {
    return m('.NewNominator', [
      m('.compact-modal-title', [
        m('h3', [ 'Setup Nominator' ]),
      ]),
      m('.compact-modal-body',
        m(Bond)),
    ]);
  },
});

export default NewNominator;
