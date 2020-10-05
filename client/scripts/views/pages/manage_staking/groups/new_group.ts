import $ from 'jquery';
import m from 'mithril';
import app from 'state';
import Spinner from 'views/pages/spinner';
import { makeDynamicComponent } from 'models/mithril';
import { Tooltip, Input, Checkbox, Intent } from 'construct-ui';
import { ChainBase } from 'models';
import Substrate from 'controllers/chain/substrate/main';
import { IValidators } from 'controllers/chain/substrate/account';
import { formatCoin } from 'adapters/currency';
import User from 'views/components/widgets/user';
import Identity from '../../validators/substrate/identity';

const MAX_SELECT = 16;

interface NewGroupState { dynamic: {
  validators: IValidators
} }

interface NewGroupAttrs {}

interface IModel {
  loading: boolean,
  onChange(e:Event): void,
  onSelect(stash: string): void,
  create(e: Event, vnode:  m.VnodeDOM): void,
  selected: string[],
  name: string,
  intent: Intent,
  checked(stash): boolean
}

const model : IModel = {
  intent: null,
  loading: false,
  selected: [],
  name: '',
  onChange: (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    const { value } = target;
    model.intent = value
      ? Intent.POSITIVE
      : Intent.NEGATIVE;
    model.name = value;
  },
  onSelect: (stash: string) => {
    const index = model.selected.indexOf(stash);
    if (index > -1) {
      model.selected.splice(index, 1);
    } else if (model.selected.length < MAX_SELECT) {
      model.selected.push(stash);
    }
  },
  checked: (stash: string) => {
    return model.selected.indexOf(stash) > -1;
  },
  create: async (e: Event, vnode:  m.VnodeDOM) => {
    const payload = { stashes: model.selected, name: model.name };
    model.loading = true;
    const response = await (app.chain as Substrate).app.chainEvents.createValidatorGroups(payload);
    model.loading = false;
    if (response) {
      e.preventDefault();
      $(vnode.dom).trigger('modalexit');
      m.route.set(`/${app.activeChainId()}`);
    }
  }
};

const NewGroup = makeDynamicComponent<NewGroupAttrs, NewGroupState>({
  oncreate: () => {
    model.selected = [];
    model.name = '';
    model.intent = Intent.NEGATIVE;
    model.loading = false;
  },
  getObservables: () => ({
    groupKey: app.chain.class.toString(),
    validators: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.validators
      : null
  }),
  view: (vnode) => {
    const { validators } = vnode.state.dynamic;

    if (!validators || model.loading)
      return m('.NewGroup.min-h-200', [
        m('.compact-modal-title.center-lg', [
          m('h3', 'New Group')
        ]),
        m(Spinner)
      ]);

    return m('.NewGroup.manage-staking', [
      m('.compact-modal-title.center-lg', [
        m('h3', 'New Group')
      ]),
      m('.compact-modal-body',
        m('div.padding-t-10.new-row',
          m('h5', 'Group Name'),
          m('span.group-name', [
            m(Input, {
              fluid: true,
              defaultValue: model.name,
              intent: model.intent,
              onchange: model.onChange,
              placeholder: 'Enter group name'
            })
          ])),
        m('span.select', [
          m('div.compact-modal-title.center-lg.padding-t-10.new-row', [
            m('h5', 'selected'),
            m('h1', `${model.selected.length} out of ${MAX_SELECT}`)
          ])
        ]),
        m('span.Validators',
          m('table.validators-table.new-row', [
            m('tr.validators-heading', [
              m('th.modal-val-stash', 'Stash'),
              m('th.modal-val-total', 'Total Stake'),
              m('th.modal-val-commission', 'Commission'),
              m('th.modal-val-select', 'Selected')
            ]),
            Object.entries(validators).map(([_stash, { commissionPer, exposure }]) => {
              return m('tr.ValidatorRow',
                m('td.modal-val-stash', m(Tooltip, {
                  content: m(Identity, { stash : _stash }),
                  trigger: m('div', m(User, { user: app.chain.accounts.get(_stash), linkify: true }))
                })),
                m('td.modal-val-total', [
                  formatCoin(app.chain.chain.coins(exposure?.total.toBn()), true), ' '
                ]),
                m('td.modal-val-commission', `${commissionPer.toFixed(2)}%`),
                m('td.modal-val-select',
                  m(Checkbox, {
                    checked: model.checked(_stash),
                    label: '',
                    size: 'sm',
                    onchange: () => model.onSelect(_stash)
                  })));
            })
          ])),
        m('div.center-lg.padding-t-10.button-rows', [
          m('button.cui-button.cui-align-center.cui-primary', {
            disabled: !model.selected.length || !model.name,
            onclick: (e: Event) => model.create(e, vnode),
          }, 'Create'),
        ]))
    ]);
  },
});

export default NewGroup;
