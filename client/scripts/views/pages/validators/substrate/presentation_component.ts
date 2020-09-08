import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { get } from 'lodash';
import Substrate from 'controllers/chain/substrate/main';
import { ChainBase } from 'models';
import { formatNumber } from '@polkadot/util';
import { Icon, Icons, Spinner, ListItem, Select, InputSelect } from 'construct-ui';
import Tabs from '../../../components/widgets/tabs';
import ValidatorRow from './validator_row';
import ValidatorRowWaiting from './validator_row_waiting';
import RecentBlock from './recent_block';

let result = { validators: [] };
const model = {
  scroll: false,
  state: 'Active',
  prevIndex: 0,
  nextIndex: 0,
  pageSize: 5,
  // scroll: 1,
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
  activeStashes: [],
  waitingStashes: [],
  sortKey: 'exposure.total',
  sortAsc: true,
  extraOp: [],

  onSearchHandler(value?: string) {
    console.log("valueee ", value)
    model.searchIsOn = true;
    // if search box is empty then refresh
    if (!value) {
      if (model.state === 'Active') {
        console.log(model.profile, "model.profile")
        model.activeStashes = model.profile.filter(row => row.state === 'Active').map((addr) => addr.address)
      }
      else {
        console.log(model.waitingStashes, "waitingStashes");
        model.waitingStashes = model.profile.filter(row => row.state === 'Waiting').map((addr) => addr.address);
      }
      model.onChange();
      model.searchIsOn = false;
      m.redraw();
    }
    // if search option is provided
    if (value) {
      model.searchValue = value;
      model.searchCriteria = { value };
      let mapNamesAddress = [];
      const temp = [...model.profile];
      if (model.state === 'Active') {
        mapNamesAddress = temp.filter(row => row.state === 'Active')
      } else {
        mapNamesAddress = temp.filter(row => row.state === 'Waiting');
      }
      mapNamesAddress = mapNamesAddress.map(ele => { return { name: ele.name, address: ele.address } });
      for (let i of mapNamesAddress) {
        model.extraOp = [...model.extraOp, i.name, i.address];
      }
      let validators = [];
      value = value.toLowerCase();

      //fetch from already fetched list
      result.validators.forEach((ele => {

        if (ele.name?.toLowerCase().includes(value) || ele.stash_id.toLowerCase().includes(value)) {
          validators.push(ele);
        }
      }));

      if (!validators.length) {
        console.log("fetching from outside")
        let obj = [];
        model.extraOp.forEach((ele) => {
          if (ele.toLowerCase().includes(value)) {
            obj = [...obj, ele];
          }
        });
        model.state === 'Active' ? model.activeStashes = obj : model.waitingStashes = obj;
        console.log(obj, "obj");
        model.refresh();
        m.redraw()
        return;
      }
      console.log("fetched")
      result.validators = validators;

      m.redraw()
      return;
    }
  },
  async onChange() {
    let validatorStashes: any = model.activeStashes;
    if (model.state === 'Waiting') { validatorStashes = model.waitingStashes; }
    let { prevIndex, nextIndex, pageSize } = model;
    let validators: any = [];
    if (validatorStashes.length >= prevIndex) {
      validators = await (app.staking as any).validatorDetail(model.state, validatorStashes.slice(prevIndex, nextIndex + pageSize));
      prevIndex = nextIndex;
      nextIndex = nextIndex + pageSize;
      model.prevIndex = prevIndex;
      model.nextIndex = nextIndex;
    }
    console.log(validators.validators, "validators------------------")
    result.validators = [...result.validators, ...validators.validators];
    result.validators = result.validators.filter((v, i, a) => a.findIndex(t => (t.stash_id === v.stash_id)) === i);
    m.redraw();
  },
  async refresh() {
    let validatorStashes: any = model.activeStashes;
    if (model.state === 'Waiting') { validatorStashes = model.waitingStashes; }
    let { prevIndex, nextIndex, pageSize } = model;
    // let validators: any = [];
    if (validatorStashes.length >= prevIndex) {
      result = await (app.staking as any).validatorDetail(model.state, validatorStashes.slice(prevIndex, nextIndex + pageSize));
      prevIndex = nextIndex;
      nextIndex = nextIndex + pageSize;
      model.prevIndex = prevIndex;
      model.nextIndex = nextIndex;
      m.redraw();
    }
    // result.validators = [...result.validators, ...validators.validators];
    // result.validators = result.validators.filter((v, i, a) => a.findIndex(t => (t.stash_id === v.stash_id)) === i);

  },
  sortIcon(key: string) {
    return model.sortKey === key
      ? model.sortAsc
        ? Icons.ARROW_UP
        : Icons.ARROW_DOWN
      : Icons.MINUS;
  },
  profile: [],
  reset(index) {
    model.pagination.currentPageNo = 1;
    model.show = true;
    if (index === 0) {
      model.currentTab = 'current';
      model.state = 'Active';
      window.scrollTo(0, 0);
      model.scroll = false;
      model.prevIndex = 0;
      model.nextIndex = 0;
      console.log("state ", model.state);
      model.activeStashes = model.profile.filter(row => row.state === 'Active').map((addr) => addr.address)
      m.redraw();
      model.refresh();
    }
    if (index === 1) {
      model.currentTab = 'waiting';
      model.state = 'Waiting';
      window.scrollTo(0, 0);
      model.prevIndex = 0;
      model.nextIndex = 0;
      model.scroll = false;
      console.log("state ", model.state);
      model.waitingStashes = model.profile.filter(row => row.state === 'Waiting').map((addr) => addr.address);
      m.redraw();
      model.refresh();
    }
    if (index > 1) {
      model.show = false;
      m.redraw();
    }
    if (model.searchValue)
      model.onSearchHandler(model.searchValue);
  },

  changeSort(key: string) {
    if (key === model.sortKey)
      model.sortAsc = !model.sortAsc;
    model.sortKey = key;
  }
};

export const PresentationComponent_ = {

  oninit: async () => {
    model.validatorNamesAddrss = await app.staking.validatorNamesAddress();
    model.profile = (model.validatorNamesAddrss as any).profileData;
    console.log("profile ======", model.profile);

    model.activeStashes = model.profile.filter(row => row.state === 'Active').map((addr) => addr.address);
    model.waitingStashes = model.profile.filter(row => row.state === 'Waiting').map((addr) => addr.address);
    model.refresh();
    // console.log("validators ", result);
  },
  view: () => {
    let { changeSort, reset, sortAsc, sortIcon, sortKey, onSearchHandler } = model;

    if (!result?.validators?.length)
      return m(Spinner, {
        fill: true,
        message: 'Loading Validators...',
        size: 'xl',
        style: 'visibility: visible; opacity: 1;'
      });

    // if (model.searchValue) {
    //   let valueExist = true;
    //   result.validators?.forEach(ele => {
    //     valueExist = true;
    //     if (!ele.stash_id.includes(model.searchValue) && !ele.name.includes(model.searchValue)) {
    //       valueExist = false;
    //     }
    //   });
    //   if (!valueExist) console.log("not found");
    // }
    const chain = app.chain as Substrate;
    console.log("validators ", result.validators);

    const lastHeaders = (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.lastHeaders
      : [];

    result.validators = result.validators?.sort((val1, val2) => {
      if (sortAsc)
        return get(val2, sortKey, 0) - get(val1, sortKey, 0);
      return get(val1, sortKey, 0) - get(val2, sortKey, 0);
    })
    // result.validators = result.validators?.sort((val1, val2) => val2?.exposure - val1?.exposure);


    //onscroll fetch next N record
    $(window).scroll(function () {
      if (!model.scroll) {
        // End of the document reached?
        if ($(document).height() - $(this).height() - 100 < $(this).scrollTop()) {
          // alert('Just 100 pixels above to Bottom');
          model.scroll = true;
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
            result.validators.map((validator) => {
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
            result.validators.map((validator) => {
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
