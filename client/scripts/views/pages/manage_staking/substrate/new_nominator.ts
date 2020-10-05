import $ from 'jquery';
import BN from 'bn.js';
import m from 'mithril';
import app from 'state';
import { ITXModalData } from 'models';
import { makeDynamicComponent } from 'models/mithril';
import Bond from 'views/pages/manage_staking/substrate/bond';
import Nominate from 'views/pages/manage_staking/substrate/nominate';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { SiDef } from '@polkadot/util/types';
import { getValuesFromBn } from 'views/pages/manage_staking/substrate/validate_amount';
import Substrate from 'controllers/chain/substrate/main';
import { createTXModal } from 'views/modals/tx_signing_modal';

const MAX_STEP = 2;
const MIN_STEP = 1;

export function openTXModal(txFunc: ITXModalData) {
  try {
    createTXModal(txFunc)
      .then((modalData: ITXModalData) => {
        return (app.chain as Substrate).app.chainEvents.createChainStake({
          stash: modalData.author.address
        });
      })
      .then(() => {
        m.route.set(`/${app.activeChainId()}`);
      });
  } catch (e) {
    m.route.set(`/${app.activeChainId()}`);
  }
}

export interface IModelPartial {
  error: boolean,
  bonded: IBonded | null,
  step: number,
  txSuccess: boolean,
  onBondedChange(bonded: IBonded, noError: boolean): void,
  next(): void,
  bond(): void,
  txCallback(success: boolean): void
}

interface NewNominatorState { dynamic: {} }

interface NewNominatorAttrs {}

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
  nominates: string[],
  onNominateChange(selected: string[]): void,
}

const model: IModel = {
  txSuccess: false,
  error: true,
  bonded: null,
  step: MIN_STEP,
  nominates: [],
  onBondedChange: (bonded: IBonded, noError: boolean) => {
    model.bonded = bonded;
    model.error = !noError;
  },
  onNominateChange: (selected: string[]) => {
    model.nominates = selected;
  },
  next: () => {
    if (model.step < MAX_STEP)
      model.step = ++model.step;
  },
  bond: () => {
    let amount = new BN(0);
    amount = getValuesFromBn(model.bonded.balance, model.bonded.si);
    const stashId = model.bonded.stash.address;
    const controllerId = model.bonded.controller.address;
    const destination = model.bonded.payment.value;

    const bondOwnTx = (app.chain as Substrate).chain.getTxMethod('staking', 'bond')(stashId, amount, destination);
    const bondTx = (app.chain as Substrate).chain.getTxMethod('staking', 'bond')(controllerId, amount, destination);
    const controllerTx = (app.chain as Substrate).chain.getTxMethod('staking', 'setController')(controllerId);
    const nominateTx = (app.chain as Substrate).chain.getTxMethod('staking', 'nominate')(model.nominates);

    const params = stashId === controllerId
      ? [bondTx, nominateTx]
      : [bondOwnTx, nominateTx, controllerTx];
    const txFunc = (model.bonded.stash as SubstrateAccount).batchTx(params);
    txFunc.cb = model.txCallback;
    openTXModal(txFunc);
  },
  txCallback: (success) => {
    model.txSuccess = success;
  }
};

const NewNominator = makeDynamicComponent<NewNominatorAttrs, NewNominatorState>({
  oncreate: () => {
    model.step = MIN_STEP;
    model.nominates = [];
    model.bonded = null;
    model.error = true;
  },
  getObservables: () => ({
    groupKey: app.chain.class.toString()
  }),
  view: (vnode) => {
    return m('.NewNominator.manage-staking', [
      m('.compact-modal-title.center-lg', [
        m('h5', [ `Step ${model.step} of ${MAX_STEP}` ]),
        m('h3.modal-title', [ 'Setup Nominator' ]),
      ]),
      m('.compact-modal-body',
        model.step === MIN_STEP
        && m('span.first-step', [
          m(Bond, {
            onChange: model.onBondedChange
          }),
          m('div.center-lg.padding-t-10.button-row', [
            m('button.cui-button.cui-align-center.cui-primary', {
              disabled: model.error,
              onclick: model.next,
            }, 'Next')
          ])
        ]),
        model.step === MAX_STEP
        && m('span.second-step', [
          m(Nominate, {
            onChange: model.onNominateChange
          }),
          m('div.center-lg.padding-t-10.button-row', [
            !model.txSuccess
            && m('button.cui-button.cui-align-center.cui-primary', {
              disabled: !model.nominates.length,
              onclick: model.bond,
            }, 'Bond & Nominate'),
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

export default NewNominator;
