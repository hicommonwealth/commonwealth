import m from 'mithril';
import app from 'state';
import { ChainBase } from 'models';
import Substrate from 'controllers/chain/substrate/main';
import { makeDynamicComponent } from 'models/mithril';
import { Col, Grid } from 'construct-ui';
import User from 'views/components/widgets/user';
import { pull } from 'lodash';

interface NominateState { dynamic: {
  validators: string[]
} }

interface NominateAttrs {
  onChange(selected: string[]): void,
}

interface IModel {
  isLoading: boolean,
  selected: string[],
  not_selected: string[],
  add(address: string): void,
  remove(address: string): void,
}

const model: IModel = {
  isLoading: true,
  selected: [],
  not_selected: [],
  add: (address) => {
    pull(model.not_selected, address);
    model.selected.push(address);
  },
  remove: (address) => {
    pull(model.selected, address);
    model.not_selected.push(address);
  }
};

const Nominate = makeDynamicComponent<NominateAttrs, NominateState>({
  oninit: () => {
    model.isLoading = true;
    model.not_selected = [];
    model.selected = [];
  },
  onupdate: (vnode) => {
    const { validators } = vnode.state.dynamic;
    if (model.isLoading && validators.length) {
      model.isLoading = false;
      model.not_selected = validators;
      m.redraw();
    }
    vnode.attrs.onChange(model.selected);
  },
  getObservables: () => ({
    groupKey: app.chain.class.toString(),
    validators: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.validatorsAddress
      : null
  }),
  view: (vnode) => {
    const { validators } = vnode.state.dynamic;

    if (!validators)
      return m('p', 'Loading ...');

    return m('.Nominate', [
      m('h5', 'Candidate Accounts'),
      m(Grid, { gutter: { xs: 0, sm: 10, md: 20, lg: 30, xl: 40 } }, [
        m(Col, { span: { xs: 12, md: 6 }, class: 'border-r-1' }, m('.not-selected.min-height-200', [
          app.chain.loaded
          && model.not_selected.map((address) => m('span.pointer',
            { onclick: () => model.add(address) },
            m(User, {
              user: app.chain.accounts.get(address)
            }))),
          !model.not_selected.length && m('p', 'Candidates not available')
        ])),
        m(Col, { span: { xs: 12, md: 6 } }, m('.selected.min-height-200', [
          app.chain.loaded
          && model.selected.map((address) => m('span.pointer',
            { onclick: () => model.remove(address) },
            m(User, {
              user: app.chain.accounts.get(address)
            })))
        ]))
      ])
    ]);
  },
});

export default Nominate;
