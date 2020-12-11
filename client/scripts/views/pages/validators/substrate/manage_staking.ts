import m from 'mithril';
import app from 'state';
import Substrate from 'controllers/chain/substrate/main';
import { makeDynamicComponent } from 'models/mithril';
import User from 'views/components/widgets/user';
import { IValidators, SubstrateAccount } from 'controllers/chain/substrate/account';
import { ICosmosValidator } from 'controllers/chain/cosmos/account';
import { StakingLedger } from '@polkadot/types/interfaces';
import { formatAddressShort } from '../../../../../../shared/utils';
import StashAccountForm from './stash_form';
import ControllerAccountForm from './controller_form';
import NewStashForm from './new_stash_form';

interface IManageStakingModalState {
  dynamic: {
    exposures: any;
    validators: IValidators | { [address: string]: ICosmosValidator };
    bonded?: SubstrateAccount;
    stakingLedger?: StakingLedger;
  };
  sending: boolean;
  error: any;
}

const ManageStakingModal = makeDynamicComponent<{ account }, IManageStakingModalState>({
  getObservables: (attrs) => ({
    groupKey: attrs.account.address,
    exposures: attrs.account.stakingExposure,
    bonded: attrs.account.bonded,
    stakingLedger: attrs.account.stakingLedger,
    // TODO: this should get bonded/ledger status instead of validators
    validators: (app.chain as Substrate).accounts.validators,
  }),
  view: (vnode) => {
    const { exposures, validators, stakingLedger, bonded } = vnode.state.dynamic;
    const stashes = Object.entries(validators || {})
      .filter(([stash, { controller }]) => controller === vnode.attrs.account.address);

    let accountForm;
    // checks whether the account is a stash account because they are bonded, if not
    // checks whether the account is a controller because controllers have stakingLedgers
    if (vnode.state.dynamic.bonded) {
      accountForm = m(StashAccountForm, {
        controller: bonded,
      });
    } else if (stakingLedger) {
      accountForm = m(ControllerAccountForm, {
        stashes,
        stashAccount: stakingLedger.stash,
      });
    } else {
      accountForm = [
        m('h4', 'Set up a stash'),
        stashes.length > 0
          ? m('.well.not-available', 'Not available - accounts cannot be both stash and controller')
          : [
            m('p', 'For maximum security, stash keys should be kept offline on an air-gapped device.'),
            m(NewStashForm, {}),
          ],
      ];
    }

    return m('.ManageStakingModal', [
      m('.compact-modal-title', [
        m('h3', [
          'Manage Staking for ',
          m(User, { user: vnode.attrs.account }),
          `(${formatAddressShort(vnode.attrs.account.address, vnode.attrs.account.chain)})`,
        ]),
      ]),
      m('.compact-modal-body', (!exposures || !validators) ? [
        m('center', 'Loading...'),
      ] : accountForm),
    ]);
  },
});

export default ManageStakingModal;
