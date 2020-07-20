import m from 'mithril';
import app from 'state';
import { makeDynamicComponent } from 'models/mithril';
import Bond from 'views/pages/manage_staking/substrate/bond';
import Nominate from 'views/pages/manage_staking/substrate/nominate';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { SiDef } from '@polkadot/util/types';

const MAX_STEP = 2;
const MIN_STEP = 1;

interface NewNominatorState { dynamic: {} }

interface NewNominatorAttrs {}

interface IBonded {
  controller: SubstrateAccount,
  stash: SubstrateAccount,
  si: SiDef,
  balance: number,
  payment: {
    text: string,
    value: number
  }
}

interface IModel {
  error: boolean,
  bonded: IBonded | null,
  step: number,
  nominates: string[],
  onBondedChange(payload: any, noError: boolean): void,
  onNominateChange(selected: string[]): void,
  next(): void,
  bond(): void,
}

const model: IModel = {
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
    console.log('model.bonded');
    console.log(model.bonded);
    console.log(model.nominates);
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
    return m('.NewNominator', [
      m('.compact-modal-title.center-lg', [
        m('h5', [ `Step ${model.step} of ${MAX_STEP}` ]),
        m('h3', [ 'Setup Nominator' ]),
      ]),
      m('.compact-modal-body',
        model.step === MIN_STEP
        && m('span.first-step', [
          m(Bond, {
            onChange: model.onBondedChange
          }),
          m('div.center-lg.padding-t-10',
            m('button.cui-button.cui-align-center.cui-primary', {
              disabled: model.error,
              onclick: model.next,
            }, 'Next'))
        ]),
        model.step === MAX_STEP
        && m('span.second-step', [
          m(Nominate, {
            onChange: model.onNominateChange
          }),
          m('div.center-lg.padding-t-10',
            m('button.cui-button.cui-align-center.cui-primary', {
            // disabled: model.error,
              onclick: model.bond,
            }, 'Bond & Nominate'))
        ]))
    ]);
  },
});

export default NewNominator;
