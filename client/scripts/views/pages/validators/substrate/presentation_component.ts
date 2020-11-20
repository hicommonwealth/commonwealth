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

const pageSize = 20;
let result = { validators: [] };
const model = {
  scroll: false,
  state: 'Active',
  prevIndex: 0,
  nextIndex: pageSize,
  // scroll: 1,
  searchValue: '',
  searchBy: '',
  searchIsOn: false,
  searchCriteria: {},
  searchByOptions: [{ label: 'Select', value: '' }, { label: 'name', value: 'value' }, { label: 'address', value: 'value' }],
  validatorNamesAddrss: {},
  allAddresses: [],
  isLoadingData: false,
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
  constValidators: [],
  async onSearchHandler(value?: string) {
    console.log('value ', value);
    // if search option is provided
    if (value) {
      model.searchIsOn = true;
      model.searchValue = value;
      model.searchCriteria = { value };
      let mapNamesAddress = [];
      const temp = [...model.profile];
      if (model.state === 'Active') {
        mapNamesAddress = temp.filter((row) => row.state === 'Active');
      } else {
        mapNamesAddress = temp.filter((row) => row.state === 'Waiting');
      }
      mapNamesAddress = mapNamesAddress.map((ele) => { return { name: ele.name, address: ele.address }; });
      for (const i of mapNamesAddress) {
        model.extraOp = [...model.extraOp, i.name, i.address];
      }
      const validators = [];
      value = value.toLowerCase();

      // fetch from already fetched list
      // console.log(" model.constValidators ", model.constValidators)
      model.constValidators.forEach(((ele) => {
        if ((ele.name?.toLowerCase().includes(value) || ele.stash.toLowerCase().includes(value)) && ele.state === model.state) {
          validators.push(ele);
        }
      }));
      // console.log("fetch from already fetched list", validators);

      if (!validators.length) {
        // console.log("fetching from outside")
        let obj = [];
        model.extraOp.forEach((ele) => {
          if (ele.toLowerCase().includes(value)) {
            obj = [...obj, ele];
          }
        });
        if (obj.length) {
          model.state === 'Active' ? model.activeStashes = obj : model.waitingStashes = obj;
          // console.log(obj, "obj");
          model.prevIndex = 0;
          model.onSearch();
          m.redraw();
        } else {
          result.validators = [];
          m.redraw();
          return;
        }
        return;
      }
      // console.log("fetched")
      result.validators = validators;
      m.redraw();
    }
  },
  // model.currentPage < Math.ceil(model.total[model.currentTab] / model.perPage

  async onChange() {
    console.log('inside async onChange()');
    let validatorStashes: any = model.activeStashes;
    if (model.state === 'Waiting') { validatorStashes = model.waitingStashes; }
    let { prevIndex, nextIndex } = model;
    let validators: any = [];

    prevIndex = nextIndex;
    nextIndex += pageSize;

    model.prevIndex = prevIndex;
    model.nextIndex = nextIndex;

    validatorStashes = validatorStashes.slice(prevIndex, nextIndex);

    // 0console.log(validatorStashes.slice(prevIndex, nextIndex), "new fetched")
    if (validatorStashes.length) {
      // console.log("prevIndex", prevIndex)
      // console.log("nextIndex", nextIndex);
      // console.log("validatorStashes", validatorStashes);
      // console.log("model.activeStashes", model.activeStashes);
      model.isLoadingData = true;
      m.redraw();
      validators = await (app.staking as any).validatorDetail(model.state, validatorStashes);

      console.log(validators?.validators, '--------onChange---------');
      result.validators = [...result.validators, ...validators?.validators];
      result.validators = result.validators.filter((v, i, a) => a.findIndex((t) => (t.stash === v.stash)) === i);
      model.constValidators = [...result.validators, ...model.constValidators];
      model.constValidators = model.constValidators.filter((v, i, a) => a.findIndex((t) => (t.stash === v.stash)) === i);
      setTimeout(() => {
        model.isLoadingData = false;
        m.redraw();
      }, 2000);
    }
    model.scroll = false;
  },
  async onSearch() {
    let validatorStashes: any = [];
    let validators: any = [];
    const { prevIndex, nextIndex } = model;

    if (model.state === 'Active') {
      if (!model.activeStashes?.length) {
        result.validators = [];
        model.searchIsOn = true;
      } else validatorStashes = model.activeStashes;
    } else {
      if (!model.waitingStashes?.length) {
        result.validators = [];
        model.searchIsOn = true;
      } else validatorStashes = model.waitingStashes;
    }


    if (validatorStashes.length && validatorStashes.length >= prevIndex) {
      model.isLoadingData = true;
      m.redraw();
      validators = await (app.staking as any).validatorDetail(model.state, validatorStashes.slice(prevIndex, nextIndex + pageSize));
      result.validators = [...result.validators, ...validators?.validators];
      result.validators = result.validators.filter((v, i, a) => a.findIndex((t) => (t.stash === v.stash)) === i);
      model.constValidators = [...result.validators, ...model.constValidators];
      model.constValidators = model.constValidators.filter((v, i, a) => a.findIndex((t) => (t.stash === v.stash)) === i);
      setTimeout(() => {
        model.isLoadingData = false;
        m.redraw();
      }, 2000);
    }
  },
  async refresh() {
    let validatorStashes: any = [];

    if (model.state === 'Active') {
      if (!model.activeStashes?.length) {
        result.validators = [];
        model.searchIsOn = true;
      } else validatorStashes = model.activeStashes;
    } else {
      if (!model.waitingStashes?.length) {
        result.validators = [];
        model.searchIsOn = true;
      } else validatorStashes = model.waitingStashes;
    }

    model.prevIndex = 0;
    model.nextIndex = pageSize;

    // console.log("prevIndex", model.prevIndex);
    // console.log("nextIndex", model.nextIndex);
    if (validatorStashes.length && (validatorStashes.length - 1) >= model.prevIndex) {
      // console.log("validatorstashes ", validatorStashes)
      model.isLoadingData = true;
      m.redraw();
      result = await (app.staking as any).validatorDetail(model.state, validatorStashes.slice(model.prevIndex, model.nextIndex));
      result.validators.forEach((e) => {
        e.exposure = e.HistoricalValidatorStatistics[0]?.exposure;
        e.commissionPer = e.HistoricalValidatorStatistics[0]?.commissionPer;
        e.apr = e.HistoricalValidatorStatistics[0]?.apr;
        e.eraPoints = e.HistoricalValidatorStatistics[0]?.eraPoints;
        e.rewardStats = e.HistoricalValidatorStatistics[0]?.rewardsStats;
        e.slashesStats = e.HistoricalValidatorStatistics[0]?.slashesStats;
        e.offencesStats = e.HistoricalValidatorStatistics[0]?.offencesStats;
        e.hasMessage = e.HistoricalValidatorStatistics[0]?.hasMessage;
        e.isOnline = e.HistoricalValidatorStatistics[0]?.isOnline;
      });
      model.constValidators = [...result.validators, ...model.constValidators];
      model.constValidators = model.constValidators.filter((v, i, a) => a.findIndex((t) => (t.stash === v.stash)) === i);
      setTimeout(() => {
        model.isLoadingData = false;
        m.redraw();
      }, 2000);
    }
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
      console.log('state ', model.state);
      model.activeStashes = model.profile.filter((row) => row.state === 'Active').map((addr) => addr.address);
      model.refresh();
      m.redraw();
    }
    if (index === 1) {
      model.currentTab = 'waiting';
      model.state = 'Waiting';
      window.scrollTo(0, 0);
      model.scroll = false;
      console.log('state ', model.state);
      model.waitingStashes = model.profile.filter((row) => row.state === 'Waiting').map((addr) => addr.address);
      model.refresh();
      m.redraw();
    }
    if (index > 1) {
      model.show = false;
      m.redraw();
    }
    if (model.searchValue)
      model.onSearchHandler(model.searchValue);
  },
  async onReverseSearch(value?) {
    // console.log("calling reverse");
    if (value && value.trim()) {
      model.onSearchHandler(value);
      return;
    }
    model.searchValue = value;
    // console.log("if no value");
    if (model.state === 'Active') {
      // console.log(model.profile, "model.profile")
      model.activeStashes = model.profile.filter((row) => row.state === 'Active').map((addr) => addr.address);
    } else {
      // console.log(model.waitingStashes, "waitingStashes");
      model.waitingStashes = model.profile.filter((row) => row.state === 'Waiting').map((addr) => addr.address);
    }
    model.prevIndex = 0;
    model.searchIsOn = false;
    m.redraw();
    model.refresh();
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
    // console.log("profile ======", model.profile);
    // console.log("prevIndex", model.prevIndex);
    // console.log("nextIndex", model.nextIndex);
    model.activeStashes = model.profile.filter((row) => row.state === 'Active').map((addr) => addr.address);
    model.waitingStashes = model.profile.filter((row) => row.state === 'Waiting').map((addr) => addr.address);
    model.refresh();
  },
  view: (vnode) => {
    const { changeSort, reset, sortAsc, sortIcon, sortKey, onSearchHandler } = model;
    if (!result.validators.length && vnode.attrs.validators) {
      result.validators = Object.keys(vnode.attrs.validators)
        .map((v) => ({ ...vnode.attrs.validators[v], stash: v }));
    }

    if (!result.validators?.length && !model.searchIsOn)
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
    });
    // result.validators = result.validators?.sort((val1, val2) => val2?.exposure - val1?.exposure);


    // onscroll fetch next N record

    // let cont: any = $("table.validators-table");
    model.scroll = false;
    $('table.validators-table').on('scroll', function () {
      if (!model.scroll) {
        if ($(this).scrollTop() + $(this).innerHeight() + ($(this)[0].scrollHeight * 0.05)  >= $(this)[0].scrollHeight) {
          model.scroll = true;
          if (!model.searchValue && !model.searchValue.trim())
            model.onChange();
        }
      }
    });


    // console.log("cont.scrollHeight ", cont.scrollHeight)
    // $(window).scroll(function () {
    // if (!model.scroll) {
    //   // End of the document reached?
    //   // if ($(document).height() - $(this).height() - 100 < $(this).scrollTop()) {
    //   //   // alert('Just 100 pixels above to Bottom');
    //   //   model.scroll = true;
    //   //   model.searchIsOn = true;
    //   //   model.onChange();
    //   // }
    //   // .scrollHeight - e.target.offsetHeight === 0
    //   if (cont.scrollHeight - cont.offsetHeight === 0) {
    //     model.scroll = true;
    //     model.searchIsOn = true;
    //     model.onChange();
    //   }
    // }
    // });

    // const filtered = Object.keys(annualPercentRate)
    //   .map((elt) => annualPercentRate[elt])
    //   .filter((elt) => elt > -1.0 && elt < 1000.0);
    // const aprSum = filtered.reduce((prev, curr) => prev + curr, 0.0);
    // const aprAvg = (aprSum * 1.0) / filtered.length;
    return m('div.validators-container',
      m(Tabs, [{
        callback: reset,
        name: 'Current Validators',
        content: m('div.row-input',
          m('input', {
            type: 'text',
            name: 'searchCurrent',
            autofocus: true,
            placeholder: 'Search for a name, address or index...',
            onkeyup: (e) => model.onReverseSearch(e.target.value),
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
            m('th.val-rewards', 'Rewards'),
            m('th.val-slashes', 'Slashes'),
            m('th.val-offenses', 'Offenses'),
          ]), m('table.validators-table', [
            result.validators.map((validator) => {
              // console.log("validator.exposure ===== ", validator.exposure, validator.stash)
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
              const otherTotal = chain.chain.coins(Number(validator.exposure?.total) - validator.exposure?.own);
              const commission = validator?.commissionPer;
              const apr = validator?.apr;
              const name = validator?.name;
              const rewardStats = validator?.rewardStats;
              const slashesStats = validator?.slashesStats;
              const offencesStats = validator?.offencesStats;
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
                rewardStats,
                slashesStats,
                offencesStats
              });
            }),  model.isLoadingData && m(Spinner, {
              message: '',
              size: 'xl',
              style: 'visibility: visible; opacity: 1;'
            })
          ])),
      }, {
        callback: reset,
        name: 'Waiting Validators',
        content: [m('div.row-input',
          m('input', {
            type: 'text',
            name: 'searchWaiting',
            autofocus: true,
            placeholder: 'Search for a name, address or index...',
            onkeyup: (e) => model.onReverseSearch(e.target.value),
            onkeypress: (e) => {
              if (!e.target.value || !e.target.value.trim()) {
                model.searchIsOn = false;
                m.redraw();
              }
            },
          })), m('tr.validators-heading', [
          m('th.val-stash-waiting', 'Stash'),
          m('th.val-nominations', 'Nominations'),
          m('th.val-waiting-commission', 'Commission'),
          m('th.val-action', ''),
        ]), m('table.validators-table', [
          result.validators.filter((v) => !v.toBeElected && !v.isElected).map((validator) => {
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
        ])]
      }, {
        callback: reset,
        name: 'Recent Blocks',
        content: [m('tr.validators-heading', [
          m('th.val-block-number', 'Block #'),
          m('th.val-block-hash', 'Hash'),
          m('th.val-block-author', 'Author')
        ]), m('table.validators-table', [
          lastHeaders.map((lastHeader) => {
            if (!lastHeader)
              return null;
            return m(RecentBlock, {
              number: formatNumber(lastHeader.number),
              hash: lastHeader.hash.toHex(),
              author: lastHeader.author
            });
          })
        ])]
      }]));
  }
};

export default PresentationComponent_;
