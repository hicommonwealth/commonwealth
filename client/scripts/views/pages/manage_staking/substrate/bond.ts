import app from 'state';
import m from 'mithril';
import { ChainBase } from 'models';
import Substrate from 'controllers/chain/substrate/main';
import User from 'views/components/widgets/user';
import { makeDynamicComponent } from 'models/mithril';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { formatBalance, BN_TEN, BN_ZERO } from '@polkadot/util';
import { Col, Grid, SelectList, Button, Icons, Icon, Tooltip, ListItem, Input, Intent } from 'construct-ui';
import { truncate } from 'lodash';
import { Option } from '@polkadot/types';
import { SiDef } from '@polkadot/util/types';
import { AccountId, StakingLedger, } from '@polkadot/types/interfaces';
import { DeriveBalancesAll } from '@polkadot/api-derive/types';
import BN from 'bn.js';

interface BondState {
  dynamic: {}
}

interface BondAttrs { }

interface ValidateControllerState {
  dynamic: {
    ledger: Option<StakingLedger>,
    bonded: Option<AccountId>,
    allBalances: DeriveBalancesAll
  }
}

interface ValidateControllerAttrs {
  stash: SubstrateAccount,
  controller: SubstrateAccount,
  onError(isFatal: boolean): void,
}

interface FormatBalanceState {
  dynamic: {
    allBalances: DeriveBalancesAll
  }
}

interface FormatBalanceAttrs {
  controller: SubstrateAccount
}

interface ValidateAmountState {
  dynamic: {
    allBalances: DeriveBalancesAll
  }
}

interface ValidateAmountAttrs {
  controller: SubstrateAccount,
  amount: BN,
  si: SiDef,
  onError(isFatal: boolean): void
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
        tooltip: true,
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
      m('span.strong', truncate(this.selectedItem.profile.displayName, { length: 20 })),
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
  return formatBalance.getOptions().map(({ power, text, value }): SiDef => ({
    text: power === 0
      ? TokenUnit.abbr
      : text,
    value,
    power
  }));
}

const model = {
  options: getSiOptions(),
  selectedItem: formatBalance.findSi('-'),
  renderItem : (item: SiDef) => {
    return m(ListItem, {
      label: item.text,
      selected: model.selectedItem && model.selectedItem === item
    });
  },
  itemPredicate: (query: string, item: SiDef) => {
    return item.text.toLowerCase().includes(query.toLowerCase())
    || item.value.toLowerCase().includes(query.toLowerCase());
  },
  handleSelect: (item: SiDef) => {
    model.selectedItem = item;
  },
  label() {
    if (!this.selectedItem)
      return null;
    return m('span', [ this.selectedItem.text ]);
  },
  balanceChange: (e) => {
    const balance = Number(e.target.value);
    model.intent = Number.isNaN(balance)
      ? Intent.NEGATIVE
      : Intent.POSITIVE;

    model.balance = balance;
  },
  intent: null,
  balance: null
};

const FormatBalance = makeDynamicComponent<FormatBalanceAttrs, FormatBalanceState>({
  getObservables: (attrs) => ({
    groupKey:  attrs.controller.profile.address,
    allBalances: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.allBalances(attrs.controller.profile.address)
      : null
  }),
  view: (vnode) => {
    const { allBalances } = vnode.state.dynamic;
    const balanceBN = new BN(allBalances?.freeBalance);
    const balance = (app.chain as Substrate).chain.coins(balanceBN);
    return m('p.balance', balance.format(true));
  }
});

function getValuesFromBn(valueBn: BN, si: SiDef | null): BN {
  const value = si
    ? valueBn.mul(BN_TEN.pow(new BN(formatBalance.getDefaults().decimals + si.power))).toString()
    : valueBn.toString();

  return new BN(value);
}

const errors = {
  controller: false,
  onController: (error) => {
    errors.controller = error;
  },
  balance: false,
  onBalance: (error) => {
    errors.balance = error;
  }
};

const ValidateAmount = makeDynamicComponent<ValidateAmountAttrs, ValidateAmountState>({
  getObservables: (attrs) => ({
    groupKey:  attrs.controller.profile.address,
    allBalances: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.allBalances(attrs.controller.profile.address)
      : null
  }),
  view: (vnode) => {
    const { amount, si, onError } = vnode.attrs;
    const { allBalances } = vnode.state.dynamic;
    const value = getValuesFromBn(amount, si);
    if (allBalances && value) {
      if (value.gte(allBalances.freeBalance)) {
        onError(true);
        return m('p.error', `The specified value is too large and 
        does not allow funds to pay future transaction fees.`);
      }
    }
    onError(false);
    return null;
  }
});

const ValidateController = makeDynamicComponent<ValidateControllerAttrs, ValidateControllerState>({
  getObservables: (attrs) => ({
    groupKey:  attrs.controller.profile.address,
    ledger: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.ledger(attrs.controller.profile.address)
      : null,
    bonded: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.bonded(attrs.controller.profile.address)
      : null,
    allBalances: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.allBalances(attrs.controller.profile.address)
      : null
  }),
  view: (vnode) => {
    const { bonded, ledger, allBalances } = vnode.state.dynamic;
    const { controller, stash, onError } = vnode.attrs;

    if (!bonded && !ledger)
      return null;
    const bondedId = bonded.isSome
      ? bonded.unwrap().toString()
      : null;
    const stashId = ledger.isSome
      ? ledger.unwrap().stash.toString()
      : null;

    let newError: string | null = null;
    let isFatal = false;
    if (bondedId) {
      isFatal = true;
      newError = `A controller account should not map to another stash. 
      This selected controller is a stash, controlled by ${bondedId}`;
    } else if (stashId) {
      isFatal = true;
      newError = `A controller account should not be set to manage multiple stashes. 
      The selected controller is already controlling ${stashId}`;
    } else if (allBalances?.freeBalance.isZero()) {
      isFatal = true;
      newError = `The controller does no have sufficient funds available to cover transaction fees. 
      Ensure that a funded controller is used.`;
    } else if (controller === stash) {
      newError = `Distinct stash and controller accounts are recommended to ensure fund security. 
      You will be allowed to make the transaction, but take care to not tie up all funds, 
      only use a portion of the available funds during this period.`;
    }
    onError(isFatal);
    if (!newError)
      return null;
    return m(`p.${isFatal ? 'error' : 'warning'}`, newError);
  }
});

const Bond = makeDynamicComponent<BondAttrs, BondState>({
  getObservables: (attrs) => ({
    groupKey:  app.chain.class.toString()
  }),
  view: (vnode) => {
    return m(Grid, {
      gutter: 20,
      align: 'middle',
      justify: 'center'
    }, [
      m(Col, { span: 12 }, m('.content',
        m('.nominee-stash',
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
              sublabel: 'Account:',
              label: stashModel.label(),
              style: 'min-width: 100%'
            })
          })),
        m('.nominee-controller.padding-t-10',
          m('h5', 'controller account', m(Tooltip, {
            content: `The controller is the account that will be used to control any nominating or validating actions. 
            Should not match another stash or controller.`,
            position: 'top',
            hasArrow: true,
            size: 'sm',
            trigger: m('span.pointer', m(Icon, { name: Icons.FLAG, size: 'sm' }))
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
              sublabel: 'Account:',
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
        m('div.padding-t-10',
          m('h5', 'Bond Value', m(Tooltip, {
            content: `The total amount of the stash balance that will be at stake in any 
            forthcoming rounds (should be less than the free amount available)`,
            position: 'top',
            hasArrow: true,
            size: 'sm',
            trigger: m('span.pointer', m(Icon, { name: Icons.FLAG, size: 'sm' }))
          })),
          m('span', [
            m(Input, {
              fluid: true,
              intent: model.intent,
              onchange: model.balanceChange,
              placeholder: 'Positive number',
              contentRight: m('span.pointer',
                m(SelectList, {
                  items: model.options,
                  itemRender: model.renderItem,
                  itemPredicate: model.itemPredicate,
                  onSelect: model.handleSelect,
                  popoverAttrs: { hasArrow: false },
                  trigger: m(Button, {
                    align: 'left',
                    compact: true,
                    iconRight: Icons.CHEVRON_DOWN,
                    sublabel: '',
                    label: model.label(),
                    style: 'min-width: 100%'
                  })
                }))
            })
          ])),
        m('div.padding-t-10.center-lg',
          m('h5', 'Balance'),
          stashModel.selectedItem
          && m(FormatBalance, {
            controller: stashModel.selectedItem
          })),
        model.selectedItem && !!model.balance && stashModel.selectedItem
          && m(ValidateAmount, {
            controller: stashModel.selectedItem,
            amount: new BN(model.balance),
            si: model.selectedItem,
            onError: errors.onBalance
          })))
    ]);
  },
});

export default Bond;
