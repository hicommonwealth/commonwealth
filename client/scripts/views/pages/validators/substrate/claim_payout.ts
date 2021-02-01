import m from 'mithril';
import app from 'state';
import User from 'views/components/widgets/user';
import { makeDynamicComponent } from 'models/mithril';
import { StakingLedger } from '@polkadot/types/interfaces';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import Substrate from 'controllers/chain/substrate/main';
import { formatAddressShort } from '../../../../../../shared/utils';
import ActionForm from './action_form';


interface IClaimPayoutModalState {
  dynamic: {
    stakingLedger?: StakingLedger;
  };
  sending: boolean;
  error: any;
}

interface IClaimPayoutState {
  era: any;
  validators?: any[];
  sending: boolean;
  error: any;
};

const NominatorForm: m.Component<{}, IClaimPayoutState> = {
  view: (vnode) => {
    return [
      m(ActionForm, {
        isTextInput: true,
        titleMsg: 'Enter an era to claim a payout from',
        actionName: 'payoutNominator',
        placeholder: 'Enter an era',
        errorMsg: 'Must enter a valid era',
        onChangeHandler: (era) => { vnode.state.era = era; },
      }),
      m(ActionForm, {
        isTextInput: true,
        titleMsg: 'Enter a list of validators',
        actionName: 'payoutNominator',
        placeholder: 'Enter a comma separated list of validator addresses',
        errorMsg: 'Must add a non-zero number of valid validator addresses',
        onChangeHandler: (validators) => {
          try {
            vnode.state.validators = validators
            .split(',')
            .map((v) => (app.chain as Substrate).accounts.fromAddress(v));
          } catch (error) {
            vnode.state.error = error;
          }
        },
        actionHandler: () => {
          const { era, validators } = vnode.state;
          if (era && validators) {
            const sender = (app.user.activeAccount as SubstrateAccount);
            return sender.claimValidatorPayoutTx(era);
          }
        },
      }),
    ];
  }
};

const ValidatorForm: m.Component<{}, IClaimPayoutState> = {
  view: (vnode) => {
    return [
      m(ActionForm, {
        isTextInput: true,
        titleMsg: 'Enter an era to claim a payout from',
        actionName: 'payoutNominator',
        placeholder: 'Enter an era',
        errorMsg: 'Must enter a valid era',
        onChangeHandler: (era) => { vnode.state.era = era; },
        actionHandler: () => {
          const { era } = vnode.state;
          if (era) {
            const sender = (app.user.activeAccount as SubstrateAccount);
            return sender.claimValidatorPayoutTx(era);
          }
        },
      }),
    ];
  }
};

const ClaimPayoutModal = makeDynamicComponent<{ account }, IClaimPayoutModalState>({
  getObservables: (attrs) => ({
    groupKey: attrs.account.address,
    stakingLedger: attrs.account.stakingLedger,
  }),
  view: (vnode) => {
    const { stakingLedger } = vnode.state.dynamic;
    const { account } = vnode.attrs;
    const isValidator = false;
    const payoutsForm = (isValidator) ? ValidatorForm : NominatorForm;
    return m('.ClaimPayoutModal', [
      m('.compact-modal-title', [
        m('h3', [
          'Claim payout for ',
          m(User, { user: account }),
          `(${formatAddressShort(account.address, account.chain)})`,
        ]),
      ]),
      m('.compact-modal-body', (!stakingLedger) ? [
        m('center', 'Loading...'),
      ] : m(payoutsForm)),
    ]);
  },
});

export default ClaimPayoutModal;
