import { default as m } from 'mithril';

import app from 'state';
import { formatCoin } from 'adapters/currency';
import { formatAddressShort, pluralize } from 'helpers';
import { createTXModal } from 'views/modals/tx_signing_modal';

import Substrate from 'controllers/chain/substrate/main';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import SubstrateAccounts, { SubstrateAccount, IValidators } from 'controllers/chain/substrate/account';
import { makeDynamicComponent } from 'models/mithril';
import User from 'views/components/widgets/user';
import { TextInputFormField, DropdownFormField } from 'views/components/forms';

import { isU8a, isHex } from '@polkadot/util';
import { decodeAddress } from '@polkadot/keyring';
import { IManageStakingModalState, IValidatorAttrs, ViewNominatorsModal } from '.';
import Tabs from '../../components/widgets/tabs';

interface IStashFormState {
  bondAmount: SubstrateCoin;
  controllerAddress: SubstrateAccount;
  rewardDestination: string;
  sending: boolean;
  error: any;
}

interface IActionFormAttrs {
  isTextInput?: boolean;
  actionName: string;
  actionHandler?: any;
  placeholder: string;
  onChangeHandler?: any;
  titleMsg: string;
  options?: any;
  choices?: any;
  errorMsg: string;
  defaultValue?: any;
}

interface IActionFormState {
  data: any;
  sending: boolean;
  error: any;
}

export const SubstrateActionForm: m.Component<IActionFormAttrs, IActionFormState> = {
  view: (vnode) => {
    const inputComponent = (vnode.attrs.isTextInput)
      ? m(TextInputFormField, {
        title: vnode.attrs.titleMsg,
        options: {
          placeholder: vnode.attrs.placeholder,
          callback: (result) => { vnode.state.data = vnode.attrs.onChangeHandler(result); },
        },
      })
      : m(DropdownFormField, {
        title: vnode.attrs.titleMsg,
        options: vnode.attrs.options,
        choices: vnode.attrs.choices,
        callback: (result) => { vnode.state.data = vnode.attrs.onChangeHandler(result); },
      });

    return m('.NewStashForm', [
      (vnode.attrs.onChangeHandler) ? inputComponent : m('h4', vnode.attrs.titleMsg),
      (vnode.attrs.actionHandler) && m('button.formular-button-primary', {
        class: app.vm.activeAccount ? '' : 'disabled',
        onclick: (e) => {
          e.preventDefault();
          const value = vnode.state.data || vnode.attrs.defaultValue;
          if (!value) return;
          const sender = app.vm.activeAccount;
          try {
            vnode.state.sending = true;
            if (sender instanceof SubstrateAccount) {
              createTXModal(vnode.attrs.actionHandler(value))
                .then(() => {
                  vnode.state.sending = false;
                  m.redraw();
                })
                .catch(e => {
                  vnode.state.sending = false;
                  m.redraw();
                });
            } else {
              throw new Error(vnode.attrs.errorMsg);
            }
          } catch (e) {
            vnode.state.error = e.message;
            vnode.state.sending = false;
            m.redraw();
          }
        },
      }, vnode.attrs.actionName),
    ]);
  },
};

export const StashAccountForm: m.Component<{ controller: SubstrateAccount }, {}> = {
  view: (vnode) => [
    m('p', `This account is configured as a stash for ${vnode.attrs.controller.address}`),
    m('h4', 'Stash actions'),
    m('.stash-actions', [
      m(SubstrateActionForm, {
        isTextInput: true,
        titleMsg: 'Set a new controller',
        actionName: 'setController',
        placeholder: 'Set a nes controller',
        errorMsg: 'Can only set controller on Substrate based chain.',
        onChangeHandler: (newController) => (app.chain.accounts as SubstrateAccounts).fromAddress(newController),
        actionHandler: (newController) => (app.vm.activeAccount as SubstrateAccount).setController(newController),
      }),
      m(SubstrateActionForm, {
        isTextInput: true,
        titleMsg: 'Add extra bond',
        actionName: 'bondExtra',
        placeholder: 'Bond extra',
        errorMsg: 'Can only bond extra on Substrate based chain.',
        onChangeHandler: (bondAmount) => (app.chain.chain.coins(+bondAmount, true)),
        actionHandler: (bondAmount) => (app.vm.activeAccount as SubstrateAccount).bondExtraTx(bondAmount),
      }),
      m(SubstrateActionForm, {
        isTextInput: false,
        titleMsg: 'Set a new reward destination',
        actionName: 'setPayee',
        placeholder: 'Set new reward destination',
        errorMsg: 'Can only set payee on Substrate based chain.',
        options: {
          name: 'rewardDestination',
          style: 'padding: 5px',
        },
        choices: [
          { value: 'staked', label: 'Stash account (increase the amount at stake)' },
          { value: 'stash', label: 'Stash account (do not increase the amount at stake)' },
          { value: 'controller', label: 'Controller account' },
        ],
        defaultValue: 'staked',
        onChangeHandler: (payee) => payee,
        actionHandler: (payee) => (app.vm.activeAccount as SubstrateAccount).setPayee(payee),
      }),
    ]),
  ],
};

export const ControllerAccountForm: m.Component<{ stashes, stash }, {}> = {
  view: (vnode) => [
    m('p', `This account is configured as a controller for ${vnode.attrs.stash}`),
    vnode.attrs.stashes.map(([stash, { exposure, balance }]) => m('.well', [
      m('.stash-stat', [
        m('h5', 'Stash'),
        m('.stash-stat-text', [
          m(User, { user: stash, avatarSize: 24 }),
        ]),
      ]),
      m('.stash-stat', [
        m('h5', 'Bonded'),
        m('.stash-stat-text', [
          m('.stash-balance', app.chain.chain.coins(exposure.own).format(true)),
        ]),
      ]),
      m('.stash-stat', [
        m('h5', 'Free'),
        m('.stash-stat-text', [
          // XXX: this needs to be fixed!
          m('.stash-balance', app.chain.chain.coins(0/*balance*/).format(true)),
        ]),
      ]),
      m('.clear'),
    ])),
    m('.stash-actions', [
      m(SubstrateActionForm, {
        isTextInput: true,
        titleMsg: 'Unbond from stash',
        actionName: 'unbond',
        placeholder: 'Enter a token amount to unbond from',
        errorMsg: 'Can only unbond on Substrate based chain.',
        onChangeHandler: (unbondAmount) => (app.chain.chain.coins(+unbondAmount, true)),
        actionHandler: (unbondAmount) => (app.vm.activeAccount as SubstrateAccount).unbond(unbondAmount),
      }),
      m(SubstrateActionForm, {
        isTextInput: true,
        titleMsg: 'Set new session keys',
        actionName: 'setKeys',
        placeholder: 'Enter the keys result from rotate_keys',
        errorMsg: 'Can only set session keys on Substrate based chain.',
        onChangeHandler: (keys) => keys,
        actionHandler: (keys) => (app.vm.activeAccount as SubstrateAccount).setKeys(keys),
      }),
      m(SubstrateActionForm, {
        isTextInput: true,
        titleMsg: 'Set validator commission [0-100]',
        actionName: 'validate',
        placeholder: 'Enter a value between 0 and 100',
        errorMsg: 'Can only validate on Substrate based chain.',
        onChangeHandler: (commission) => commission,
        actionHandler: (commission) => (app.vm.activeAccount as SubstrateAccount).validateTx(commission),
      }),
      vnode.attrs.stashes.length > 0 && m(SubstrateActionForm, {
        titleMsg: 'Chill from nominating/validating',
        actionName: 'chill',
        placeholder: 'Chill',
        errorMsg: 'Can only chill on Substrate based chain.',
        actionHandler: () => (app.vm.activeAccount as SubstrateAccount).chillTx(),
      }),
    ]),
  ],
};

const NewSubstrateStashForm: m.Component<{}, IStashFormState> = {
  oncreate: (vnode) => {
    vnode.state.rewardDestination = 'stash';
  },
  view: (vnode) => m('.NewStashForm', [
    m(SubstrateActionForm, {
      isTextInput: true,
      titleMsg: 'Set bonded controller',
      actionName: 'bond',
      placeholder: 'Enter a controller address',
      errorMsg: 'Can only set controller on Substrate based chain.',
      onChangeHandler: (newController) => {
        vnode.state.controllerAddress = null;

        const address = newController;
        if (isU8a(address) || isHex(address)) {
          return;
        }
        console.log('controller', address);
        try {
          const addr = decodeAddress(address);
          console.log(addr);
        } catch (e) {
          return;
        }

        vnode.state.controllerAddress = (app.chain.accounts as SubstrateAccounts).fromAddress(newController);
      },
    }),
    m(SubstrateActionForm, {
      isTextInput: true,
      titleMsg: 'Set bond amount',
      actionName: 'bond',
      placeholder: 'Enter a bond amount',
      errorMsg: 'Can only set bond on Substrate based chain.',
      onChangeHandler: (bondAmount) => { vnode.state.bondAmount = (app.chain.chain.coins(+bondAmount, true)); },
    }),
    m(SubstrateActionForm, {
      isTextInput: false,
      titleMsg: 'Set Payee',
      actionName: 'Create new stash',
      placeholder: 'Set new reward destination',
      errorMsg: 'Can only bond on Substrate based chain.',
      options: {
        name: 'rewardDestination',
        style: 'padding: 5px',
      },
      choices: [
        { value: 'staked', label: 'Stash account (increase the amount at stake)' },
        { value: 'stash', label: 'Stash account (do not increase the amount at stake)' },
        { value: 'controller', label: 'Controller account' },
      ],
      defaultValue: 'staked',
      onChangeHandler: (payee) => {
        vnode.state.rewardDestination = payee;
        return vnode.state.rewardDestination;
      },
      actionHandler: () => {
        const { controllerAddress, bondAmount, rewardDestination } = vnode.state;
        if (controllerAddress && bondAmount && rewardDestination) {
          console.log(controllerAddress, bondAmount, rewardDestination);
          const sender = (app.vm.activeAccount as SubstrateAccount);
          return sender.bondTx(controllerAddress, bondAmount, rewardDestination);
        }
      },
    }),
  ]),
};

export const ManageSubstrateStakingModal = makeDynamicComponent<{ account }, IManageStakingModalState>({
  getObservables: (attrs) => ({
    groupKey: attrs.account.address,
    exposures: attrs.account.stakingExposure,
    bonded: attrs.account.bonded,
    stakingLedger: attrs.account.stakingLedger,
    // TODO: this should get bonded/ledger status instead of validators
    validators: (app.chain as Substrate).accounts.validators,
  }),
  view: (vnode) => {
    const { exposures } = vnode.state.dynamic;
    const { validators } = vnode.state.dynamic;
    const stashes = Object.entries(validators || {})
      .filter(([stash, { controller }]) => controller === vnode.attrs.account.address);

    let accountForm;
    // checks whether the account is a stash account because they are bonded, if not
    // checks whether the account is a controller because controllers have stakingLedgers
    if (vnode.state.dynamic.bonded) {
      accountForm = m(StashAccountForm, {
        controller: vnode.state.dynamic.bonded,
      });
    } else if (vnode.state.dynamic.stakingLedger) {
      accountForm = m(ControllerAccountForm, {
        stashes,
        stash: vnode.state.dynamic.stakingLedger.stash,
      });
    } else {
      accountForm = [
        m('h4', 'Set up a stash'),
        stashes.length > 0 ?
          m('.well.not-available', 'Not available - accounts cannot be both stash and controller') : [
            m('p', 'For maximum security, stash keys should be kept offline on an air-gapped device.'),
            m(NewSubstrateStashForm, {}),
          ],
      ];
    }

    return m('.ManageStakingModal', [
      m('.compact-modal-title', [
        m('h3', [
          'Manage Staking for ',
          m(User, { user: vnode.attrs.account }),
          `(${formatAddressShort(vnode.attrs.account.address)})`,
        ]),
      ]),
      m('.compact-modal-body', (!exposures || !validators) ? [
        m('center', 'Loading...'),
      ] : accountForm),
    ]);
  },
});

export interface ISubstrateValidatorState {
  isNominating: boolean;
}

export const SubstrateValidatorRow: m.Component<IValidatorAttrs, ISubstrateValidatorState> = {
  oninit: (vnode) => {
    vnode.state.isNominating = vnode.attrs.hasNominated;
  },
  view: (vnode) => {
    return m('tr.ValidatorRow', [
      m('td.val-name', 'Validator'),
      m('td.val-controller', m(User, { user: app.chain.accounts.get(vnode.attrs.controller), linkify: true })),
      m('td.val-stash', m(User, { user: app.chain.accounts.get(vnode.attrs.stash), linkify: true })),
      m('td.val-total', [
        formatCoin(vnode.attrs.total, true),
        ' ',
        vnode.attrs.nominators.length > 0 && [
          '(',
          m('a.val-nominators', {
            href: '#',
            onclick: (e) => {
              e.preventDefault();
              app.modals.create({
                modal: ViewNominatorsModal,
                data: { nominators: vnode.attrs.nominators, validatorAddr: vnode.attrs.stash }
              });
            }
          }, pluralize(vnode.attrs.nominators.length, 'nominator')),
          ')',
        ],
      ]),
      //m('td.val-age', '--'),
      m('td.val-action', [
        m('button.nominate-validator.formular-button-primary', {
          class: app.vm.activeAccount ? '' : 'disabled',
          onclick: (e) => {
            e.preventDefault();
            vnode.state.isNominating = !vnode.state.isNominating;
            vnode.attrs.onChangeHandler(vnode.attrs.stash);
          }
        }, vnode.state.isNominating ? 'Un-Nominate' : 'Nominate'),
      ]),
    ]);
  }
};

export const ValidationPreHeader = (vnode, chain: Substrate, sender: SubstrateAccount) => {
  const validators: IValidators = vnode.state.dynamic.validators;
  if (!validators) return;
  let totalStaked = chain.chain.coins(0);
  Object.entries(validators).forEach(([_stash, { exposure }]) => {
    const valStake = chain.chain.coins(exposure.total.toBn());
    totalStaked = chain.chain.coins(totalStaked.asBN.add(valStake.asBN));
  });
  return m('.validators-preheader', [
    m('.validators-preheader-item', [
      m('h3', 'Current Block'),
      m('.preheader-item-text', chain.block.height),
    ]),
    m('.validators-preheader-item', [
      m('h3', 'Total Supply'),
      m('.preheader-item-text', chain.chain.totalbalance.format(true)),
    ]),
    m('.validators-preheader-item', [
      m('h3', 'Total Staked'),
      m('.preheader-item-text', totalStaked.format(true)),
    ]),
    m('.validators-preheader-item', [
      m('h3', 'Manage Staking'),
      m('.preheader-item-text', [
        m('a.btn.formular-button-primary', {
          class: app.vm.activeAccount ? '' : 'disabled',
          href: '#',
          onclick: (e) => {
            e.preventDefault();
            app.modals.create({
              modal: ManageSubstrateStakingModal,
              data: { account: sender }
            });
          }
        }, 'Manage'),
      ]),
    ]),
    vnode.state.nominationsHasChanged && m('.validators-preheader-item', [
      m('h3', 'Update nominations'),
      m('.preheader-item-text', [
        m('a.btn.formular-button-primary', {
          class: app.vm.activeAccount ? '' : 'disabled',
          href: '#',
          onclick: (e) => {
            e.preventDefault();
            createTXModal((vnode.state.nominations.length === 0)
              ? sender.chillTx()
              : sender.nominateTx(vnode.state.nominations)).then(() => {
              // vnode.attrs.sending = false;
              m.redraw();
            }, (e) => {
              // vnode.attrs.sending = false;
              m.redraw();
            });
          }
        }, 'Update nominations'),
      ]),
    ]),
  ]);
};

export const ValidatorPresentationComponent = (vnode, chain: Substrate) => {
  const validators = vnode.state.dynamic.validators;
  if (!validators) return;
  return m(Tabs, [{
    name: 'Current Validators',
    content: m('table.validators-table', [
      m('tr.validators-heading', [
        m('th.val-name', 'Name'),
        m('th.val-controller', 'Controller'),
        m('th.val-stash', 'Stash'),
        m('th.val-total', 'Total Bonded'),
        // m('th.val-age', 'Validator Age'),
        m('th.val-action', ''),
      ]),
      Object.keys(validators).filter((validator) => (validators[validator].isElected === true))
        .sort((val1, val2) => validators[val2].exposure - validators[val1].exposure)
        .map((validator) => {
          const total = chain.chain.coins(validators[validator].exposure.total);
          const bonded = chain.chain.coins(validators[validator].exposure.own);
          const nominated = chain.chain.coins(total.asBN.sub(bonded.asBN));
          const nominators = validators[validator].exposure.others.map(({ who, value }) => ({
            stash: who.toString(),
            balance: chain.chain.coins(value),
          }));
          const controller = validators[validator].controller;
          const hasNominated: boolean = app.vm.activeAccount && nominators
            && !!nominators.find(({ stash }) => stash === app.vm.activeAccount.address);
          // add validator to collection if hasNominated already
          if (hasNominated) {
            vnode.state.nominations.push(validator);
            vnode.state.originalNominations.push(validator);
          }
          return m(SubstrateValidatorRow, {
            stash: validator,
            controller,
            total,
            bonded,
            nominated,
            nominators,
            hasNominated,
            onChangeHandler: (result) => {
              if (vnode.state.nominations.indexOf(result) === -1) {
                vnode.state.nominations.push(result);
              } else {
                vnode.state.nominations = vnode.state.nominations.filter((n) => n !== result);
              }
            }
          });
        }),
    ])
  }, {
    name: 'Next Up',
    content: m('table.validators-table', [
      m('tr.validators-heading', [
        m('th.val-name', 'Name'),
        m('th.val-controller', 'Controller'),
        m('th.val-stash', 'Stash'),
        m('th.val-total', 'Total Bonded'),
        // m('th.val-age', 'Validator Age'),
        m('th.val-action', ''),
      ]),
      Object.keys(validators).filter((validator) => (validators[validator].isElected !== true))
        .sort((val1, val2) => validators[val2].exposure - validators[val1].exposure)
        .map((validator) => {
          const total = chain.chain.coins(validators[validator].exposure.total);
          const bonded = chain.chain.coins(validators[validator].exposure.own);
          const nominated = chain.chain.coins(total.asBN.sub(bonded.asBN));
          const nominators = validators[validator].exposure.others.map(({ who, value }) => ({
            stash: who.toString(),
            balance: chain.chain.coins(value),
          }));
          const controller = validators[validator].controller;
          return m(SubstrateValidatorRow, { stash: validator, controller, total, bonded, nominated, nominators });
        }),
    ])
  }]);
}