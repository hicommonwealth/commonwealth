import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { get } from 'lodash';
import Substrate from 'controllers/chain/substrate/main';
import { ChainBase } from 'models';
import { formatNumber } from '@polkadot/util';
import { Icon, Icons, Spinner } from 'construct-ui';
import Tabs from '../../../components/widgets/tabs';
import ValidatorRow from './validator_row';
import ValidatorRowWaiting from './validator_row_waiting';
import RecentBlock from './recent_block';

const pageSize = 5;
let result = { validators: [] };
const model = {
  scroll: false,
  show: true,
  sortAsc: true,
  searchIsOn: false,
  state: 'Active',
  prevIndex: 0,
  nextIndex: pageSize,
  searchValue: '',
  currentTab: 'current',
  validatorNamesAddress: {},
  activeStashes: [],
  waitingStashes: [],
  constValidators: [],
  profile: [],
  sortKey: 'exposure.total',
  async onSearch() {
    let validatorStashes: any = [];
    if (model.state === 'Active') {
      if (!model.activeStashes?.length) {
        result.validators = [];
        model.searchIsOn = true;
      } else validatorStashes = model.activeStashes;
    }
    else {
      if (!model.waitingStashes?.length) {
        result.validators = [];
        model.searchIsOn = true;
      } else validatorStashes = model.waitingStashes;
    }
    await model.setValidators(validatorStashes);
  },
  async onSearchHandler(value: string) {
    // if search option is provided
    if (value && value.trim()) {
      model.searchIsOn = true;
      model.searchValue = value;
      let validators = [];
      value = value.toLowerCase();
      let mapNamesAddress = [];
      const temp = [...model.profile];

      //filter out names and address to search
      if (model.state === 'Active') mapNamesAddress = temp.filter(row => row.state === 'Active');
      else mapNamesAddress = temp.filter(row => row.state === 'Waiting');
      mapNamesAddress = mapNamesAddress.map(ele => { return { name: ele.name, stash: ele.address } }); //remove state property


      //fetch from already fetched list
      model.constValidators.forEach((ele => {
        if ((ele.name?.toLowerCase().includes(value) || ele.stash.toLowerCase().includes(value)) && ele.state === model.state) {
          validators.push(ele);
        }
      }));
      if (validators.length) {
        result.validators = validators;
        m.redraw()
        return;
      }


      //fetching validators by api call if matching stashes found
      let matchedStashes = [];
      mapNamesAddress.forEach((ele) => {
        if (ele.name?.toLowerCase().includes(value) || ele.stash.toLowerCase().includes(value)) {
          matchedStashes = [...matchedStashes, ele.stash];
        }
      });

      //if matched stashes not found then return
      if (!matchedStashes.length) {
        result.validators = [];
        m.redraw();
        return;
      }
      //else fetch from api
      model.state === 'Active' ? model.activeStashes = matchedStashes : model.waitingStashes = matchedStashes;
      model.prevIndex = 0;
      model.onSearch();
      m.redraw();
      return;
    }
  },
  async onReverseSearch(value) {
    if (value && value.trim()) {
      model.onSearchHandler(value);
      return;
    }
    model.searchValue = value;
    if (model.state === 'Active') model.activeStashes = model.profile.filter(row => row.state === 'Active').map((addr) => addr.address);
    else model.waitingStashes = model.profile.filter(row => row.state === 'Waiting').map((addr) => addr.address);
    model.prevIndex = 0;
    model.searchIsOn = false;
    m.redraw();
    model.refresh();
  },
  async refresh() {
    let validatorStashes: any = [];

    if (model.state === 'Active') {
      if (!model.activeStashes?.length) {
        result.validators = [];
        model.searchIsOn = true;
      } else validatorStashes = model.activeStashes;
    }
    else {
      if (!model.waitingStashes?.length) {
        result.validators = [];
        model.searchIsOn = true;
      } else validatorStashes = model.waitingStashes;
    }

    model.prevIndex = 0;
    model.nextIndex = pageSize;

    if (validatorStashes.length && (validatorStashes.length - 1) >= model.prevIndex) {
      result = await (app.staking as any).validatorDetail(model.state, validatorStashes.slice(model.prevIndex, model.nextIndex));
      model.constValidators = [...result.validators, ...model.constValidators];
      model.constValidators = model.constValidators.filter((v, i, a) => a.findIndex(t => (t.stash === v.stash)) === i);
      m.redraw();
    }
  },
  async onChange() {
    let validatorStashes: any = model.activeStashes;
    if (model.state === 'Waiting') validatorStashes = model.waitingStashes;

    model.prevIndex = model.nextIndex;
    model.nextIndex = model.nextIndex + pageSize;

    validatorStashes = validatorStashes.slice(model.prevIndex, model.nextIndex);
    await model.setValidators(validatorStashes);

  },
  async setValidators(validatorStashes) {
    let validators: any = [];
    if (validatorStashes.length && validatorStashes.length >= model.prevIndex) {
      validators = await (app.staking as any).validatorDetail(model.state, validatorStashes);

      result.validators = [...result.validators, ...validators?.validators];
      result.validators = result.validators.filter((v, i, a) => a.findIndex(t => (t.stash === v.stash)) === i);

      model.constValidators = [...result.validators, ...model.constValidators];
      model.constValidators = model.constValidators.filter((v, i, a) => a.findIndex(t => (t.stash === v.stash)) === i);
      m.redraw();
    }
  },
  sortIcon(key: string) {
    return model.sortKey === key
      ? model.sortAsc
        ? Icons.ARROW_UP
        : Icons.ARROW_DOWN
      : Icons.MINUS;
  },
  reset(index) {
    model.show = true;
    if (index === 0) {
      model.onTabChange('current', 'Active');
    }
    if (index === 1) {
      model.onTabChange('waiting', 'Waiting');
    }
    if (index > 1) {
      model.show = false;
      m.redraw();
    }
    if (model.searchValue)
      model.onSearchHandler(model.searchValue);
  },
  onTabChange(currentTab, state) {
    model.currentTab = currentTab;
    model.state = state;
    window.scrollTo(0, 0);
    model.scroll = false;
    console.log("state ", model.state);
    if (state === 'Active') model.activeStashes = model.profile.filter(row => row.state === state).map((addr) => addr.address);
    else model.waitingStashes = model.profile.filter(row => row.state === state).map((addr) => addr.address);
    model.refresh();
    m.redraw();
  },
  changeSort(key: string) {
    if (key === model.sortKey)
      model.sortAsc = !model.sortAsc;
    model.sortKey = key;
  }
};

export const PresentationComponent_ = {
  oninit: async () => {
    model.validatorNamesAddress = await app.staking.validatorNamesAddress();
    model.profile = (model.validatorNamesAddress as any).profileData;
    model.activeStashes = model.profile.filter(row => row.state === 'Active').map((addr) => addr.address);
    model.waitingStashes = model.profile.filter(row => row.state === 'Waiting').map((addr) => addr.address);
    model.refresh();
  },
  view: () => {
    let { changeSort, reset, sortAsc, sortIcon, sortKey, onSearchHandler } = model;

    if (!result?.validators?.length && !model.searchIsOn)
      return m(Spinner, {
        fill: true,
        message: 'Loading Validators...',
        size: 'xl',
        style: 'visibility: visible; opacity: 1;'
      });
    const chain = app.chain as Substrate;

    const lastHeaders = (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.lastHeaders
      : [];

    result.validators = result.validators?.sort((val1, val2) => {
      if (sortAsc)
        return get(val2, sortKey, 0) - get(val1, sortKey, 0);
      return get(val1, sortKey, 0) - get(val2, sortKey, 0);
    })
    //onscroll fetch next N record
    model.scroll = false;
    $("table.validators-table").on('scroll', function () {
      if (!model.scroll) {
        if ($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
          model.scroll = true;
          if (!model.searchValue && !model.searchValue.trim())
            model.onChange();
        }
      }
    });

    // const filtered = Object.keys(annualPercentRate)
    //   .map((elt) => annualPercentRate[elt])
    //   .filter((elt) => elt > -1.0 && elt < 1000.0);
    // const aprSum = filtered.reduce((prev, curr) => prev + curr, 0.0);
    // const aprAvg = (aprSum * 1.0) / filtered.length;

    return m('div.validators-container',
      m(Tabs, [
        {
          callback: reset,
          name: 'Current Validators',
          content: m('div.row-input',
            m('input', {
              type: 'text',
              name: 'searchCurrent',
              autofocus: true,
              placeholder: 'Search for a name, address or index...',
              onkeyup: (e) => {
                { onSearchHandler(e.target.value) }
              },
              onkeydown: (e) => {
                { model.onReverseSearch(e.target.value) }
              },
              onkeypress: (e) => {
                if (!e.target.value || !e.target.value.trim()) {
                  model.searchIsOn = false;
                }
              },
            }), m('tr.validators-heading', [
              m('th.val-stash', 'Stash'),
              m('th.val-total', 'Total Stake',
                m('div.sort-icon', m(Icon, {
                  name: sortIcon('exposure.total'),
                  size: 'lg',
                  onclick: () => changeSort('exposure.total')
                }))),
              // m('th.val-own', 'Own Stake',
              //   m(Icon, { name: sortIcon('exposure.own'),
              //     size: 'lg',
              //     onclick: () => changeSort('exposure.own') })),
              m('th.val-other', 'Other Stake',
                m('div.sort-icon', m(Icon, {
                  name: sortIcon('otherTotal'),
                  size: 'lg',
                  onclick: () => changeSort('otherTotal')
                }))),
              m('th.val-commission', 'Commission',
                m('div.sort-icon', m(Icon, {
                  name: sortIcon('commissionPer'),
                  size: 'lg',
                  onclick: () => changeSort('commissionPer')
                }))),
              m('th.val-points', 'Points',
                m('div.sort-icon', m(Icon, {
                  name: sortIcon('eraPoints'),
                  size: 'lg',
                  onclick: () => changeSort('eraPoints')
                }))),
              m('th.val-apr', 'Est. APR'),
              // m('th.val-last-hash', 'last #'),
              m('th.val-rewards-slashes-offenses', 'Rewards/Slashes/Offenses')
            ]), m('table.validators-table', [
              result.validators.map((validator) => {
                // total stake
                const total = chain.chain.coins(+validator.exposure?.total);
                // own stake
                const bonded = chain.chain.coins(+validator.exposure?.own);
                const nominators = validator.exposure?.others.map(({ who, value }) => ({
                  stash: who.toString(),
                  balance: chain.chain.coins(+value),
                }));
                const stash = validator.stash;
                const controller = validator.controller;
                const eraPoints = validator.eraPoints;
                const blockCount = validator.blockCount;
                const hasMessage = validator?.hasMessage;
                const isOnline = validator?.isOnline;
                const otherTotal = validator?.otherTotal;
                const commission = validator?.commissionPer;
                const apr = validator?.apr;
                const name = validator?.name;
                // let apr = annualPercentRate[validator];
                // apr = (apr === -1.0 || typeof apr === 'undefined') ? aprAvg : apr;
                return m(ValidatorRow, {
                  stash,
                  total,
                  bonded,
                  commission,
                  otherTotal,
                  controller,
                  nominators,
                  eraPoints,
                  blockCount,
                  hasMessage,
                  isOnline,
                  apr,
                });
              }),
            ]))
        }, {
          callback: reset,
          name: 'Waiting Validators',
          content: m('table.validators-table', [
            m('div.row-input',
              m('input', {
                type: 'text',
                name: 'searchWaiting',
                autofocus: true,
                placeholder: 'Search for a name, address or index...',
                onkeyup: (e) => {
                  { onSearchHandler(e.target.value) }
                },
                onkeydown: (e) => {
                  { model.onReverseSearch(e.target.value) }
                },
                onkeypress: (e) => {
                  if (!e.target.value || !e.target.value.trim()) {
                    model.searchIsOn = false;
                    m.redraw();
                  }
                },
              })),
            m('tr.validators-heading', [
              m('th.val-stash-waiting', 'Stash'),
              m('th.val-nominations', 'Nominations'),
              m('th.val-waiting-commission', 'Commission'),
              m('th.val-action', ''),
            ]),
            result.validators.map((validator) => {
              const stash = validator.stash;
              const controller = validator.controller;
              const eraPoints = validator.eraPoints;
              const toBeElected = validator.toBeElected;
              const blockCount = validator.blockCount;
              const hasMessage = validator?.hasMessage;
              const isOnline = validator?.isOnline;
              const commission = validator?.commissionPer;
              const name = validator?.name;
              return m(ValidatorRowWaiting, {
                stash,
                controller,
                waiting: true,
                eraPoints,
                toBeElected,
                blockCount,
                hasMessage,
                isOnline,
                commission,
                name
              });
            }),
          ])
        }, {
          callback: reset,
          name: 'Recent Blocks',
          content: m('table.validators-table', [
            m('tr.validators-heading', [
              m('th.val-block-number', 'Block #'),
              m('th.val-block-hash', 'Hash'),
              m('th.val-block-author', 'Author')
            ]),
            lastHeaders.map((lastHeader) => {
              if (!lastHeader)
                return null;
              return m(RecentBlock, {
                number: formatNumber(lastHeader.number),
                hash: lastHeader.hash.toHex(),
                author: lastHeader.author
              });
            })
          ])
        }]));
  }
};

export default PresentationComponent_;
