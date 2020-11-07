import app from 'state';
import m from 'mithril';
import User from 'views/components/widgets/user';
import { makeDynamicComponent } from 'models/mithril';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { formatBalance } from '@polkadot/util';
import { Col, Grid, SelectList, Button, Icons, Icon, Tooltip, ListItem, Input, Intent } from 'construct-ui';
import { truncate } from 'lodash';
import { SiDef } from '@polkadot/util/types';
import FormatBalance from './format_balance';
import ValidateController from './validate_controller';
import ValidateAmount from './validate_amount';

interface BondState { dynamic: {} }

interface BondAttrs {
  onChange(param1: any, param2: any): void
}

class Controller {
  selectedItem: SubstrateAccount;
  constructor() {
    this.selectedItem = null;
  }
  renderItem(item: SubstrateAccount) {
    return m(ListItem, {
      contentRight: m('span.controller', m(User, {
        user: item,
        hideAvatar: true,
        hideIdentityIcon: true,
        // tooltip: true,
        showRole: true,
      })),
      label:  m('span.controller', [
        m(User, {
          user: item,
          avatarOnly: true,
          avatarSize: 36
        }),
      item.profile?.address && truncate(item.profile.address, { length: 30 })
      ]),
      selected: this.selectedItem === item
    });
  }
  itemPredicate(query: string, item: SubstrateAccount) {
    const name = item.profile?.displayName;
    const address = item.profile?.address;
    return name.toLowerCase().includes(query.toLowerCase())
    || address.toLowerCase().includes(query.toLowerCase());
  }
  handleSelect(item: SubstrateAccount) {
    this.selectedItem = item;
  }
  label() {
    if (!this.selectedItem)
      return null;
    return m('span', [
      m('span.padding-r7', truncate(this.selectedItem.profile.displayName, { length: 20 })),
      truncate(this.selectedItem.profile.address, { length: 25 }),
    ]);
  }
}

const ctlModel = new Controller();
const stashModel = new Controller();

export class TokenUnit {
  public static abbr = 'Unit';

  public static setAbbr(abbr: string = TokenUnit.abbr): void {
    TokenUnit.abbr = abbr;
  }
}

function getSiOptions(): SiDef[] {
  const temp = formatBalance.getOptions(10)
    .map(({ power, text, value }): SiDef => ({
      text: power === 0
        ? TokenUnit.abbr
        : text,
      value,
      power
    }));
  return temp;
}

interface IBondedModel {
  options: SiDef[],
  selectedItem: SiDef,
  renderItem(item: SiDef): m.Vnode<any, any>,
  itemPredicate(query: string, item: SiDef): boolean,
  handleSelect(item: SiDef): void,
  label(): m.Vnode<any, any>,
  balanceChange(e:Event): void,
  intent: Intent,
  balance: string
}
const bondedModel: IBondedModel = {
  options: [],
  selectedItem: formatBalance.findSi('-'),
  renderItem: (item: SiDef) => {
    return m(ListItem, {
      label: item.text,
      selected: bondedModel.selectedItem && bondedModel.selectedItem === item
    });
  },
  itemPredicate: (query: string, item: SiDef) => {
    return item.text.toLowerCase().includes(query.toLowerCase())
    || item.value.toLowerCase().includes(query.toLowerCase());
  },
  handleSelect: (item: SiDef) => {
    bondedModel.selectedItem = item;
  },
  label() {
    if (!this.selectedItem)
      return null;
    return m('span', [ this.selectedItem.text ]);
  },
  balanceChange: (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    const balance = Number(target.value);

    bondedModel.intent = Number.isNaN(balance)
      ? Intent.NEGATIVE
      : Intent.POSITIVE;

    bondedModel.balance = target.value;
  },
  intent: null,
  balance: null
};

export const rewardDestinationOptions = [
  { text: 'Stash account (increase the amount at stake)', value: 0 },
  { text: 'Stash account (do not increase the amount at stake)', value: 1 },
  { text: 'Controller account', value: 2 }
];

interface IPaymentModel {
  text: string,
  value: number
}
const paymentModel = {
  options: rewardDestinationOptions,
  selectedItem: rewardDestinationOptions[0],
  renderItem : (item: IPaymentModel) => {
    return m(ListItem, {
      label: item.text,
      selected: paymentModel.selectedItem && paymentModel.selectedItem === item
    });
  },
  itemPredicate: (query: string, item: IPaymentModel) => {
    return item.text.toLowerCase().includes(query.toLowerCase());
  },
  handleSelect: (item: IPaymentModel) => {
    paymentModel.selectedItem = item;
  },
  label() {
    if (!this.selectedItem)
      return null;
    return m('span', [ this.selectedItem.text ]);
  }
};

interface IErrors {
  controller: boolean,
  onController(error: boolean): void,
  balance: boolean,
  onBalance(error: boolean): void
}
const errors: IErrors = {
  controller: true,
  onController: (error) => {
    errors.controller = error;
  },
  balance: true,
  onBalance: (error) => {
    errors.balance = error;
  }
};

const Bond = makeDynamicComponent<BondAttrs, BondState>({
  oninit: () => {
    TokenUnit.setAbbr(app.chain.currency);
    bondedModel.options = getSiOptions();
    bondedModel.selectedItem = { power: 0, value: app.chain.currency, text: app.chain.currency };
    errors.controller = true;
    errors.balance = true;
    ctlModel.selectedItem = null;
    stashModel.selectedItem = null;
  },
  getObservables: (attrs) => ({
    groupKey:  app.chain.class.toString()
  }),
  view: (vnode) => {
    const { onChange } = vnode.attrs;
    const isError = !errors.controller && !errors.balance;

    const payload = {
      controller: ctlModel.selectedItem,
      stash: stashModel.selectedItem,
      si: bondedModel.selectedItem,
      balance: bondedModel.balance,
      payment: paymentModel.selectedItem
    };
    onChange(payload, isError);

    return m(Grid, {
      gutter: 20,
      align: 'middle',
      justify: 'center'
    }, [
      m(Col, { span: 12 }, m('.content',
        m('.nominee-stash.new-row',
          m('h5', 'stash account'),
          m(SelectList, {
            emptyContent: 'No accounts available',
            items: app.user.activeAccounts.length
              ? app.user.activeAccounts
              : [],
            itemRender: (item) => stashModel.renderItem(item as SubstrateAccount),
            itemPredicate: (query, item) => stashModel.itemPredicate(query, item as SubstrateAccount),
            onSelect: (item) => stashModel.handleSelect(item as SubstrateAccount),
            popoverAttrs: { hasArrow: false },
            trigger: m(Button, {
              align: 'left',
              compact: true,
              iconRight: Icons.CHEVRON_DOWN,
              sublabel: stashModel.label() ? '' : 'Select Stash',
              label: stashModel.label(),
              style: 'min-width: 100%'
            })
          })),
        m('.nominee-controller.padding-t-10.new-row',
          m('h5', 'controller account', m(Tooltip, {
            content: `The controller is the account that will be used to control any nominating or validating actions. 
            Should not match another stash or controller.`,
            position: 'top',
            hasArrow: true,
            size: 'sm',
            trigger: m('span.help-pointer', m(Icon, { name: Icons.HELP_CIRCLE, size: 'sm' }))
          })),
          m(SelectList, {
            emptyContent: 'No accounts available',
            items: app.user.activeAccounts.length
              ? app.user.activeAccounts
              : [],
            itemRender: (item) => ctlModel.renderItem(item as SubstrateAccount),
            itemPredicate: (query, item) => ctlModel.itemPredicate(query, item as SubstrateAccount),
            onSelect: (item) => ctlModel.handleSelect(item as SubstrateAccount),
            popoverAttrs: { hasArrow: false },
            trigger: m(Button, {
              align: 'left',
              compact: true,
              iconRight: Icons.CHEVRON_DOWN,
              sublabel: ctlModel.label() ? '' : 'Select Controller',
              label: ctlModel.label(),
              style: 'min-width: 100%'
            })
          })),
        ctlModel.selectedItem
          && m(ValidateController, {
            stash: stashModel.selectedItem,
            controller: ctlModel.selectedItem,
            onError: errors.onController
          }),
        m('div.padding-t-10.new-row',
          m('h5', 'Bond Value', m(Tooltip, {
            content: `The total amount of the stash balance that will be at stake in any 
            forthcoming rounds (should be less than the free amount available)`,
            position: 'top',
            hasArrow: true,
            size: 'sm',
            trigger: m('span.help-pointer', m(Icon, { name: Icons.HELP_CIRCLE, size: 'sm' }))
          })),
          m('span.bonded-value', [
            m(Input, {
              fluid: true,
              intent: bondedModel.intent,
              onchange: bondedModel.balanceChange,
              placeholder: 'Positive number',
              contentRight: m(SelectList, {
                items: bondedModel.options,
                itemRender: bondedModel.renderItem,
                itemPredicate: bondedModel.itemPredicate,
                onSelect: bondedModel.handleSelect,
                popoverAttrs: { hasArrow: false },
                trigger: m(Button, {
                  align: 'left',
                  compact: true,
                  iconRight: Icons.CHEVRON_DOWN,
                  sublabel: '',
                  label: bondedModel.label()
                })
              })
            })
          ])),
        bondedModel.selectedItem && !!bondedModel.balance && stashModel.selectedItem
          && m(ValidateAmount, {
            controller: stashModel.selectedItem,
            amount: bondedModel.balance,
            si: bondedModel.selectedItem,
            onError: errors.onBalance
          }),
        stashModel.selectedItem
          && m('div.padding-t-10.center-lg.new-row',
            m('h5', 'Balance'),
            m(FormatBalance, {
              controller: stashModel.selectedItem
            })),
        m('div.padding-t-10.new-row',
          m('h5', 'Payment Destination', m(Tooltip, {
            content: `The destination account for any payments as either 
            a nominator or validator`,
            position: 'top',
            hasArrow: true,
            size: 'sm',
            trigger: m('span.help-pointer', m(Icon, { name: Icons.HELP_CIRCLE, size: 'sm' }))
          })),
          m('span.pointer',
            m(SelectList, {
              items: paymentModel.options,
              itemRender: paymentModel.renderItem,
              itemPredicate: paymentModel.itemPredicate,
              onSelect: paymentModel.handleSelect,
              popoverAttrs: { hasArrow: false },
              trigger: m(Button, {
                align: 'left',
                compact: true,
                iconRight: Icons.CHEVRON_DOWN,
                sublabel: '',
                label: paymentModel.label(),
                style: 'min-width: 100%'
              })
            })))))
    ]);
  },
});

export default Bond;
