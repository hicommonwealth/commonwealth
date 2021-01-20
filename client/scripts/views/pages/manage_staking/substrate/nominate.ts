import m from 'mithril';
import app from 'state';
import { ChainBase } from 'models';
import Spinner from 'views/pages/spinner';
import Substrate from 'controllers/chain/substrate/main';
import { makeDynamicComponent } from 'models/mithril';
import { GroupValidator } from 'controllers/chain/substrate/staking';
import { Col, Grid, Icon, Icons, PopoverMenu, MenuItem } from 'construct-ui';
import User from 'views/components/widgets/user';
import { pull, pullAll, cloneDeep } from 'lodash';

interface NominateState { dynamic: {
  validators: string[]
} }

interface NominateAttrs {
  onChange(selected: string[]): void,
}

interface IModel {
  groups: GroupValidator[],
  selectedGroup: number,
  isLoading: boolean,
  selected: string[],
  not_selected: string[],
  add(address: string): void,
  remove(address: string): void,
  onGroupSelect(group: GroupValidator): void
}

const model: IModel = {
  groups: [],
  selectedGroup: null,
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
  },
  onGroupSelect: (group) => {
    model.selectedGroup = group.id;
    const stashes = cloneDeep(group.stashes);

    model.not_selected = model.not_selected.concat(model.selected);
    model.selected = [];
    pullAll(model.not_selected, stashes);
    model.selected = stashes;
  }
};

const Nominate = makeDynamicComponent<NominateAttrs, NominateState>({
  oninit: async () => {
    model.isLoading = true;
    model.not_selected = [];
    model.selected = [];
    model.selectedGroup = null;
    model.groups = await (app.chain as Substrate).app.chainEvents.getValidatorGroups({});
  },
  onupdate: (vnode) => {
    const { validators } = vnode.state.dynamic;
    if (model.isLoading && validators) {
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

    if (!validators || model.isLoading)
      return m(Spinner);

    return m('.Nominate', [
      m('div.center-lg',
        m(PopoverMenu, {
          closeOnContentClick: true,
          content: model.groups.map((group) => {
            return m(MenuItem, {
              label: group.name,
              active: group.id === model.selectedGroup,
              onclick: () => model.onGroupSelect(group)
            });
          }),
          menuAttrs: { size: 'sm' },
          trigger: m('span.pointer', [
            m('h5.inline', 'Groups'),
            m(Icon, { name: Icons.USERS, size: 'sm' })
          ])
        })),
      m('hr'),
      m(Grid, { gutter: { xs: 0, sm: 10, md: 20, lg: 30, xl: 40 } }, [
        m(Col, { span: { xs: 12, md: 6 }, class: 'border-r-1' },
          m('h5', 'Candidate Accounts'),
          m('.not-selected.min-height-200', [
            app.chain.loaded
          && model.not_selected.map((address) => m('span.pointer',
            { onclick: () => model.add(address) },
            m(User, {
              user: app.chain.accounts.get(address)
            }))),
            !model.not_selected.length && m('p', 'Candidates not available')
          ])),
        m(Col, { span: { xs: 12, md: 6 } },
          m('h5', 'Selected Candidate Accounts'),
          m('.selected.min-height-200', [
            app.chain.loaded
          && model.selected.map((address) => m('span.pointer',
            { onclick: () => model.remove(address) },
            m(User, {
              user: app.chain.accounts.get(address)
            }))),
            !model.selected.length && m('p', 'Select a candidate')
          ]))
      ])
    ]);
  },
});

export default Nominate;
