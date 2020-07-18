import m from 'mithril';
import app from 'state';
import { makeDynamicComponent } from 'models/mithril';
import Bond from 'views/pages/manage_staking/substrate/bond';

const MAX_STEP = 2;
const MIN_STEP = 1;

interface NewNominatorState { dynamic: {} }

interface NewNominatorAttrs {}

interface IModel {
  error: boolean,
  payload: object,
  step: number,
  onChange(payload: any, noError: boolean): void,
  next(): void,
  bond(): void,
}

const model: IModel = {
  error: true,
  payload: {},
  step: MIN_STEP,
  onChange: (payload: object, noError: boolean) => {
    model.payload = payload;
    model.error = !noError;
  },
  next: () => {
    if (model.step < MAX_STEP)
      model.step = ++model.step;
  },
  bond: () => {

  }
};

const NewNominator = makeDynamicComponent<NewNominatorAttrs, NewNominatorState>({
  oncreate: () => {
    model.step = MIN_STEP;
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
            onChange: model.onChange
          }),
          m('div.center-lg.padding-t-10',
            m('button.cui-button.cui-align-center.cui-primary', {
            // disabled: model.error,
              onclick: model.next,
            }, 'Next'))
        ]),
        model.step === MAX_STEP
        && m('span.second-step', [
          // m(Bond, {
          //   onChange: model.onChange
          // }),
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
