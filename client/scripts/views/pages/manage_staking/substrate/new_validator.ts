import $ from 'jquery';
import BN from 'bn.js';
import m from 'mithril';
import app from 'state';
import { makeDynamicComponent } from 'models/mithril';
import Bond from 'views/pages/manage_staking/substrate/bond';
import Validate from 'views/pages/manage_staking/substrate/validate';
import SessionKey from 'views/pages/manage_staking/substrate/session_key';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { SiDef } from '@polkadot/util/types';
import { getValuesFromBn } from 'views/pages/manage_staking/substrate/validate_amount';
import Substrate from 'controllers/chain/substrate/main';
import { BN_ZERO } from '@polkadot/util';
import { openTXModal, IModelPartial } from './new_nominator';

const MAX_STEP = 2;
const MIN_STEP = 1;

interface NewValidatorState { dynamic: {} }

interface NewValidatorAttrs {}

interface IBonded {
  controller: SubstrateAccount,
  stash: SubstrateAccount,
  si: SiDef,
  balance: string,
  payment: {
    text: string,
    value: number
  }
}

interface IModel extends IModelPartial {
  commission: { value: number, valid: boolean },
  key: { value: string, valid: boolean },
  onValidateChange(commission: number, valid?: boolean): void,
  onKeyChange(key: string, valid?: boolean): void,
}

const model: IModel = {
  txSuccess: false,
  error: true,
  bonded: null,
  step: MIN_STEP,
  commission: {
    value: null,
    valid: false
  },
  key: {
    value: null,
    valid: false
  },
  onBondedChange: (bonded: IBonded, noError: boolean) => {
    model.bonded = bonded;
    model.error = !noError;
  },
  onValidateChange: (commission: number, valid?: boolean) => {
    model.commission = { value: commission, valid };
  },
  onKeyChange: (key: string, valid?: boolean) => {
    model.key = { value: key, valid };
  },
  next: () => {
    if (model.step < MAX_STEP)
      model.step = ++model.step;
  },
  bond: () => {
    let amount = new BN(0);
    const COMM_MUL = new BN(1e7);
    amount = getValuesFromBn(model.bonded.balance, model.bonded.si);
    const commission: BN = (new BN(model.commission.value) || BN_ZERO).mul(COMM_MUL);
    const stashId = model.bonded.stash.address;
    const controllerId = model.bonded.controller.address;
    const destination = model.bonded.payment.value;

    const bondOwnTx = (app.chain as Substrate).chain.getTxMethod('staking', 'bond')(stashId, amount, destination);
    const bondTx = (app.chain as Substrate).chain.getTxMethod('staking', 'bond')(controllerId, amount, destination);
    const controllerTx = (app.chain as Substrate).chain.getTxMethod('staking', 'setController')(controllerId);
    const sessionTx = (app.chain as Substrate).chain.getTxMethod('session', 'setKeys')(
      model.key.value as any, new Uint8Array()
    );
    const validateTx = (app.chain as Substrate).chain.getTxMethod('staking', 'validate')({
      commission: commission.isZero()
        // small non-zero set to avoid isEmpty
        ? 1
        : commission
    });
    const params = stashId === controllerId
      ? [bondTx, sessionTx, validateTx]
      : [bondOwnTx, sessionTx, validateTx, controllerTx];
    const txFunc = (model.bonded.stash as SubstrateAccount).batchTx(params);
    txFunc.cb = model.txCallback;
    openTXModal(txFunc);
  },
  txCallback: (success) => {
    model.txSuccess = success;
  }
};

const NewValidator = makeDynamicComponent<NewValidatorAttrs, NewValidatorState>({
  oncreate: () => {
    model.step = MIN_STEP;
    model.commission = { value: null, valid: false };
    model.bonded = null;
    model.error = true;
  },
  getObservables: () => ({
    groupKey: app.chain.class.toString()
  }),
  view: (vnode) => {
    return m('.NewValidator.manage-staking', [
      m('.compact-modal-title.center-lg', [
        m('h5', [ `Step ${model.step} of ${MAX_STEP}` ]),
        m('h3', [ 'Setup Validator' ]),
      ]),
      m('.compact-modal-body',
        model.step === MIN_STEP
        && m('span.first-step', [
          m(Bond, {
            onChange: model.onBondedChange
          }),
          m('div.center-lg.padding-t-10', [
            m('button.cui-button.cui-align-center.cui-primary', {
              disabled: model.error,
              onclick: model.next,
            }, 'Next')
          ])
        ]),
        model.step === MAX_STEP
        && m('span.second-step', [
          m(SessionKey, {
            onChange: model.onKeyChange
          }),
          m(Validate, {
            onChange: model.onValidateChange
          }),
          m('div.center-lg.padding-t-10', [
            !model.txSuccess
            && m('button.cui-button.cui-align-center.cui-primary', {
              disabled: !model.commission.valid || !model.key.valid,
              onclick: model.bond,
            }, 'Bond & Validate'),
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

export default NewValidator;
