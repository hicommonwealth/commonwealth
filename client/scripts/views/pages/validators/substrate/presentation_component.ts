import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { get } from 'lodash';
import Substrate from 'controllers/chain/substrate/main';
import { ChainBase } from 'models';
import { formatNumber } from '@polkadot/util';
import { Icon, Icons, Spinner, TextArea, Select } from 'construct-ui';
import Tabs from '../../../components/widgets/tabs';
import ValidatorRow from './validator_row';
import ValidatorRowWaiting from './validator_row_waiting';
import RecentBlock from './recent_block';

const model = {
  prevIndex: 0,
  nextIndex: 0,
  scroll: 1,
  searchValue: '',
  searchBy: '',
  searchIsOn: false,
  searchCriteria: {},
  searchByOptions: [{ label: 'Select', value: '' }, { label: 'name', value: 'value' }, { label: 'address', value: 'value' }],
  validatorNamesAddrss: {},
  allAddresses: [],
  setValue(result: string) {
    model.searchBy = result;
    model.searchCriteria = {};
  },
  pagination: {
    pageSize: 7,
    currentPageNo: 1,
  },
  currentValidators: {
    pagination: {},
    currentValidators: []
  },
  waitingValidators: {
    pagination: {},
    waitingValidators: []
  },
  currentTab: 'current',
  show: true,
  addresses: [],
  recordCount: {
    waiting: {
      totalRecords: 0,
      fetchedRecords: 0
    },
    current: {
      totalRecords: 0,
      fetchedRecords: 0
    },
  },
  sortKey: 'exposure.total',
  sortAsc: true,
  async fetchNext(address) {
    // alertalert("test")
    model.searchCriteria = { validatorStashes: address };
    // const current_val: any = await app.staking[mode](model.searchCriteria, model.pagination);

    if ((model.searchCriteria as any)?.validatorStashes?.length) {
      const current_val = await app.staking.currentValidators({ validatorStashes: address }, model.pagination);

      const waiting_val = await app.staking.waitingValidators({ validatorStashes: address }, model.pagination);

      let new_current: any = [...model.currentValidators?.currentValidators, ...current_val['currentValidators']];

      new_current = new_current.filter((v, i, a) => a.findIndex(t => (t.stash_id === v.stash_id)) === i)

      model.currentValidators.currentValidators = new_current

      console.log("fetched next  model.currentValidators ", model.currentValidators);
      // model.pagination = new_current.pagination;

      let waiting_validator: any = [...model.waitingValidators?.waitingValidators, ...waiting_val['waitingValidators']];
      waiting_validator = waiting_validator.filter((v, i, a) => a.findIndex(t => (t.stash_id === v.stash_id)) === i)
      model.waitingValidators.waitingValidators = waiting_validator

      // model.pagination = waiting_validator.pagination;
      console.log("fetched next  model.waitingValidators ", model.waitingValidators);
      // model[mode][mode] = [...model[mode][mode], ...current_val[mode]];
      //
      // model[mode].pagination = { ...model.pagination };
      m.redraw();
    }
    return;
  },
  async search(mode: string, value: string) {
    // alert(mode)
    let current_data: any;
    current_data = model[mode][mode].filter(row => row.stash_id === value);
    if (current_data.length) {
      model[mode][mode] = current_data;
      console.log(mode, "current_data ====== ", current_data,)
      m.redraw();
      return;
    }
    current_data = await app.staking[mode](model.searchCriteria);

    // console.log(current_data, "current_dataaaaaaaaaaaaaaaaaaa")
    // console.log(model[mode], "model[mode]")
    model[mode][mode] = current_data[mode];
    // model[mode].pagination = current_data.pagination;

    console.log("current_data ====== ", current_data);
    m.redraw();
    return;
  },
  onChangeHandler(address) {
    console.log("new address ", address);
    model.fetchNext(address);
    // if (model.currentTab === 'current') {
    //   model.fetchNext('currentValidators', address);
    //   return;
    // }
    // model.fetchNext('waitingValidators', address);
  },
  onSearchHandler(value?: string) {
    // alert("search")
    model.searchIsOn = true;
    // if search box is empty then refresh
    if (!value) {
      model.refresh(model.allAddresses.slice(model.prevIndex, model.nextIndex));
      model.searchIsOn = false;
      m.redraw();
    }
    // if search option is provided
    if (value) {
      model.searchValue = value;
      model.searchCriteria = { value };
      if (model.currentTab === 'current') {
        model.search('currentValidators', value);
        return;
      }
      // alert("tets waiting")
      model.search('waitingValidators', value);
      m.redraw();
    }
  },
  async refresh(address) {

    // console.log("records fetched from " + model.prevIndex + " to " + model.nextIndex);
    const staking = app.staking as any;
    model.searchValue = '';
    let criteria = { validatorStashes: address };
    if (criteria?.validatorStashes?.length) {
      model.currentValidators = await staking.currentValidators(criteria, model.pagination);
      model.waitingValidators = await staking.waitingValidators(criteria, model.pagination);
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
    model.pagination.currentPageNo = 1;
    model.show = true;
    if (index === 0) {
      model.currentTab = 'current';
    }
    if (index === 1) {
      model.currentTab = 'waiting';
    }
    if (index > 1) {
      model.show = false;
      model.refresh(model.allAddresses.slice(model.prevIndex, model.nextIndex));
      m.redraw();
    }
    if (model.searchValue)
      model.onSearchHandler(model.searchValue);
  },
  next(address) {
    // if (model.pagination.currentPageNo < Math.ceil(model.recordCount[model.currentTab].totalRecords / model.pagination.pageSize)) {
    // model.pagination.currentPageNo++;
    model.onChangeHandler(address);
    // }

  },
  changeSort(key: string) {
    if (key === model.sortKey)
      model.sortAsc = !model.sortAsc;
    model.sortKey = key;
  }
};

export const PresentationComponent_ = {

  oninit: async () => {
    model.validatorNamesAddrss = await app.staking.validatorNamesAddrss({}, {});
    model.allAddresses = (model.validatorNamesAddrss as any).map((addr) => addr.address);
    console.log("addresses ======", model.allAddresses);
    model.refresh(model.allAddresses.slice(model.nextIndex, model.nextIndex + model.pagination.pageSize));
    model.prevIndex = model.nextIndex;
    model.nextIndex = model.nextIndex + model.pagination.pageSize;

  },
  view: () => {
    let { changeSort, reset, setValue, searchBy, searchByOptions, currentValidators, waitingValidators, recordCount, sortAsc, sortIcon, sortKey, next, onSearchHandler, scroll } = model;

    if (!currentValidators?.currentValidators?.length && !waitingValidators?.waitingValidators?.length)
      return m(Spinner, {
        fill: true,
        message: 'Loading Validators...',
        size: 'xl',
        style: 'visibility: visible; opacity: 1;'
      });
    const chain = app.chain as Substrate;

    recordCount['current'].totalRecords = (currentValidators?.pagination as any).totalRecords;
    recordCount['waiting'].totalRecords = (waitingValidators?.pagination as any).totalRecords;

    recordCount['current'].fetchedRecords = currentValidators?.currentValidators?.length;
    recordCount['waiting'].fetchedRecords = waitingValidators?.waitingValidators?.length;


    console.log("currentValidators ", currentValidators);
    console.log("waitingValidators ", waitingValidators);
    let current_validators = currentValidators.currentValidators;
    let waiting_validators = waitingValidators.waitingValidators;

    const lastHeaders = (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.lastHeaders
      : [];

    current_validators = current_validators.sort((val1, val2) => {
      if (sortAsc)
        return get(val2, sortKey, 0) - get(val1, sortKey, 0);
      return get(val1, sortKey, 0) - get(val2, sortKey, 0);
    });
    waiting_validators = waiting_validators
      .sort((val1, val2) => val2.exposure - val1.exposure);

    //onscroll fetch next N record
    $(window).scroll(function () {
      if ($(window).scrollTop() + $(window).height() >= $(document).height()) {
        // addresses
        // console.log("allAddresses ", model.allAddresses)

        if (model.allAddresses.length >= model.prevIndex) {
          // console.log("slice more ", model.nextIndex, model.nextIndex + model.pagination.pageSize)
          next(model.allAddresses.slice(model.nextIndex, model.nextIndex + model.pagination.pageSize));
          model.prevIndex = model.nextIndex;
          model.nextIndex = model.nextIndex + model.pagination.pageSize;
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
          content: m('table.validators-table', [
            m('div.row-input',
              m('input', {
                type: 'text',
                name: 'searchCurrent',
                autofocus: true,
                placeholder: 'Search for a name, address or index...',
                onkeyup: (e) => {
                  { onSearchHandler(e.target.value) }
                },
              })),
            m('tr.validators-heading', [
              m('th.val-stash', 'Stash'),
              m('th.val-action', ''),
              m('th.val-total', 'Total Stake',
                m(Icon, {
                  name: sortIcon('exposure.total'),
                  size: 'lg',
                  onclick: () => changeSort('exposure.total')
                })),
              // m('th.val-own', 'Own Stake',
              //   m(Icon, { name: sortIcon('exposure.own'),
              //     size: 'lg',
              //     onclick: () => changeSort('exposure.own') })),
              m('th.val-other', 'Other Stake',
                m(Icon, {
                  name: sortIcon('otherTotal'),
                  size: 'lg',
                  onclick: () => changeSort('otherTotal')
                })),
              m('th.val-commission', 'Commission',
                m(Icon, {
                  name: sortIcon('commissionPer'),
                  size: 'lg',
                  onclick: () => changeSort('commissionPer')
                })),
              m('th.val-points', 'Points',
                m(Icon, {
                  name: sortIcon('eraPoints'),
                  size: 'lg',
                  onclick: () => changeSort('eraPoints')
                })),
              m('th.val-apr', 'Est. APR'),
              // m('th.val-last-hash', 'last #'),
              m('th.val-rewards-slashes-offenses', 'Rewards/Slashes/Offenses')
            ]),
            current_validators.map((validator) => {
              // console.log("validator.exposure ===== ", validator.exposure, validator.stash_id)
              // total stake
              const total = chain.chain.coins(+validator.exposure?.total);
              // own stake
              const bonded = chain.chain.coins(+validator.exposure?.own);
              const nominators = validator.exposure?.others.map(({ who, value }) => ({
                stash: who.toString(),
                balance: chain.chain.coins(+value),
              }));
              const stash = validator.stash_id;
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
          ])
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
              })),
            m('tr.validators-heading', [
              m('th.val-stash-waiting', 'Stash'),
              m('th.val-nominations', 'Nominations'),
              m('th.val-waiting-commission', 'Commission'),
              m('th.val-action', ''),
            ]),
            waiting_validators.map((validator) => {
              const stash = validator.stash_id;
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
                commission, name
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
