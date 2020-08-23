import $ from 'jquery';
import BN from 'bn.js';
import m from 'mithril';
import app from 'state';
import { AddressInfo } from 'models';
import { makeDynamicComponent } from 'models/mithril';
import Substrate from 'controllers/chain/substrate/main';
import Validate from 'views/pages/manage_staking/substrate/validate';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import StashController from 'views/pages/manage_staking/substrate/stash_controller';
import { BN_ZERO } from '@polkadot/util';
import { openTXModal } from './new_nominator';

interface SetValidatorState { dynamic: {} }

interface SetValidatorAttrs {
  controllerId: string;
  stashId: string;
}

interface IModel {
  stash: AddressInfo;
  error: boolean,
  txSuccess: boolean,
  bond(): void,
  txCallback(success: boolean): void
  commission: { value: number, valid: boolean },
  onValidateChange(commission: number, valid?: boolean): void,
}

const model: IModel = {
  txSuccess: false,
  error: true,
  stash: null,
  commission: {
    value: null,
    valid: false
  },
  onValidateChange: (commission: number, valid?: boolean) => {
    model.commission = { value: commission, valid };
  },
  bond: () => {
    const COMM_MUL = new BN(1e7);
    const commission: BN = (new BN(model.commission.value) || BN_ZERO).mul(COMM_MUL);
    const validateTx = (app.chain as Substrate).chain.getTxMethod('staking', 'validate')({
      commission: commission.isZero()
        // small non-zero set to avoid isEmpty
        ? 1
        : commission
    });
    const txFunc = (model.stash as any as SubstrateAccount).batchTx([validateTx]);
    txFunc.cb = model.txCallback;
    openTXModal(txFunc);
  },
  txCallback: (success) => {
    model.txSuccess = success;
  }
};

const SetValidator = makeDynamicComponent<SetValidatorAttrs, SetValidatorState>({
  oncreate: (vnode) => {
    model.error = true;
    model.stash = app.chain.accounts.get(vnode.attrs.stashId);
  },
  getObservables: () => ({
    groupKey: app.chain.class.toString()
  }),
  view: (vnode) => {
    const { controllerId, stashId } = vnode.attrs;

    return m('.SetValidator.manage-staking', [
      m('.compact-modal-title.center-lg', [
        m('h3', [ 'Set Validator Preferences' ]),
      ]),
      m('.compact-modal-body',
        m('span', [
          m(StashController, { controllerId, stashId }),
          m(Validate, {
            onChange: model.onValidateChange
          }),
          m('div.center-lg.padding-t-10', [
            !model.txSuccess
            && m('button.cui-button.cui-align-center.cui-primary', {
              disabled: !model.commission.valid,
              onclick: model.bond,
            }, 'Validate'),
            model.txSuccess
            && m('button.cui-button.cui-align-center.cui-default', {
              onclick: (e) => {
                e.preventDefault();
                $(vnode.dom).trigger('modalexit');
              },
            }, 'Close')
          ])
        ]))
    ]);
  },
});

export default SetValidator;
