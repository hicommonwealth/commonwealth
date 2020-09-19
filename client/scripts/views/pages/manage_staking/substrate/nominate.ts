import m from 'mithril';
import app from 'state';
import { ChainBase } from 'models';
import Spinner from 'views/pages/spinner';
import Substrate from 'controllers/chain/substrate/main';
import { makeDynamicComponent } from 'models/mithril';
import { GroupValidator } from 'controllers/chain/substrate/staking';
import { Col, Grid, ListItem, CustomSelect, Icon, Icons, IOption, Option } from 'construct-ui';
import User from 'views/components/widgets/user';
import { pull, pullAll } from 'lodash';

const defaultGroup = { label: 'Groups', value: 0, stashes: [] };

interface NominateState { dynamic: {
  validators: string[],
  groups: GroupValidator[]
} }

interface NominateAttrs {
  onChange(selected: string[]): void,
}
interface GroupOption extends IOption {
  stashes : string[]
}
interface IModel {
  groupOptions: GroupOption[],
  selectedGroup: number,
  isLoading: boolean,
  selected: string[],
  not_selected: string[],
  add(address: string): void,
  remove(address: string): void,
  onGroupSelect(option: GroupOption): void,
  groupRender(item: Option, isSelected: boolean, index: number): m.Vnode
}

const model: IModel = {
  groupOptions:  [],
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
  onGroupSelect: (option) => {
    model.selectedGroup = +option.value;
    model.not_selected = model.not_selected.concat(model.selected);
    model.selected = [];
    pullAll(model.not_selected, option.stashes);
    model.selected = option.stashes;
  },
  groupRender: (item, isSelected) => {
    const option : IOption = item as unknown as IOption;
    return m(ListItem, {
      contentLeft: isSelected && option.value
        ? m(Icon, { name: Icons.CHECK_SQUARE })
        : null,
      label: (item as IOption).label,
      disabled: !option.value,
      selected: isSelected
    });
  }
};

const Nominate = makeDynamicComponent<NominateAttrs, NominateState>({
  oninit: () => {
    model.isLoading = true;
    model.not_selected = [];
    model.selected = [];
    model.selectedGroup = null;
  },
  onupdate: (vnode) => {
    model.groupOptions.push(defaultGroup);
    const { validators, groups } = vnode.state.dynamic;
    if (model.isLoading && validators) {
      model.isLoading = false;
      model.not_selected = validators;
      m.redraw();
    }
    if (groups) {
      model.groupOptions = groups.map((group) => ({ label: group.name, value: group.id, stashes: group.stashes }));
    }
    vnode.attrs.onChange(model.selected);
  },
  getObservables: () => ({
    groupKey: app.chain.class.toString(),
    validators: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.validatorsAddress
      : null,
    groups:  (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.getValidatorGroups
      : null
  }),
  view: (vnode) => {
    const { validators, groups } = vnode.state.dynamic;

    if (!validators && !groups)
      return m(Spinner);

    return m('.Nominate', [
      m('div.center-lg',
        m('h5', 'Groups'),
        m(CustomSelect, {
          name: 'validator-groups',
          triggerAttrs: {
            align: 'left',
            style: 'width: 200px'
          },
          defaultValue: 0,
          value: model.selectedGroup,
          options: model.groupOptions,
          itemRender: model.groupRender,
          onSelect: model.onGroupSelect
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
