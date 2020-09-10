import 'pages/staking_calculator.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import app from 'state';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import Substrate from 'controllers/chain/substrate/main';
import { IValidators } from 'controllers/chain/substrate/account';
import { DeriveSessionProgress } from '@polkadot/api-derive/types';
import { Grid, Button, Input, Tag, Switch, SelectList, ListItem } from 'construct-ui';
import { makeDynamicComponent } from 'models/mithril';
import { ChainBase } from 'models';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import { ChainInfo, CommunityInfo } from 'models';
import { get } from 'lib/util';
import { CHAIN_CONST } from './chainconstants'
import ChainConstant from './chainconstants'
import moment from 'moment-twitter'


// duplicated in helpers.ts
export function formatNumberShort(num: number) {
  const round = (n, digits?) => {
    if (digits === undefined) digits = 2;
    return Math.round(n * Math.pow(10, digits)) / Math.pow(10, digits);
  };

  const precise = (n, digits?) => {
    if (digits === undefined) digits = 3;
    return n.toPrecision(digits)
  };

  return num > 1_000_000_000_000 ? round(num / 1_000_000_000_000).toFixed(2) + 't' :
    num > 1_000_000_000 ? round(num / 1_000_000_000).toFixed(2) + 'b' :
      num > 1_000_000 ? round(num / 1_000_000).toFixed(2) + 'm' :
        num > 1_000 ? round(num / 1_000).toFixed(2) + 'k' :
          num > 0.1 ? round(num).toFixed(2) :
            num > 0.01 ? Number(precise(num, 2)).toFixed(2) :
              num > 0.001 ? Number(precise(num, 1)).toFixed(2) :
                num.toFixed(2);
}

function formatDuration(duration: moment.Duration, short = true) {
  const years = Math.floor(duration.asYears());
  duration.add(10, 'seconds');
  const res = []
  if (years) {
    res.push((`${years} ${short ? 'Y' : 'Year'}${years > 1 ? 's' : ''} `));
    duration.add(-372 * years, 'days');
  }
  const months = Math.floor(duration.asMonths());
  if (months) {
    res.push((`${months} ${short ? 'M' : 'Month'}${months > 1 ? 's' : ''} `));
    duration.add(-31 * months, 'days');
  }
  const days = Math.floor(duration.asDays());
  if (days) {
    res.push((`${days} ${short ? 'D' : 'Day'}${days > 1 ? 's' : ''} `));
    duration.add(-1 * days, 'days');
  }
  if (duration.hours()) {
    res.push(`${duration.hours()}${short ? 'h' : ' Hour'}${duration.hours() > 1 ? 's' : ''} `);
  }
  if (duration.minutes()) {
    res.push(`${duration.minutes()}${short ? 'M' : ' Minute'}${duration.minutes() > 1 ? 's' : ''} `);
  }
  return res.join('');
}


interface IPreHeaderState {
  dynamic: {
    validators: IValidators;
    sessionInfo: DeriveSessionProgress;
  },
  selected_asset: AssetInfo;
  selected_rate: number;
  switch_mode: boolean;
  usd_price: string;
  totalStaked: SubstrateCoin;
  totalbalance: SubstrateCoin;
  stakingAmount: number;
  stakingLength: number;
  staked: number;
  rewardValue: number;
  networkValue: number;
  adjustedReward: number;
  rewardRate: number;
}

interface IPreHeaderAttrs {
  chain: ChainInfo;
}

class AssetInfo {
  name: string
  sym: string
  icon: string
  usd_value: number
  consts: ChainConstant
  calculatedInterestRate: number
  commission: number
  rewardFrequencyHours: number
}

let assets_list: AssetInfo[] = [
]

const unique = (value, index, self) => {
  return self.map(s => s.name).indexOf(value.name) === index
}

function resetValues(vnode) {
  vnode.state.selected_rate = vnode.state.staked;
  vnode.state.switch_mode = false;
  vnode.state.stakingAmount = 10000;
  vnode.state.rewardValue = 0;
  vnode.state.networkValue = 0;
  vnode.state.adjustedReward = 0;
  vnode.state.rewardEdgPerDay = 0;
  vnode.state.reward_rate = 0;
  vnode.state.stakingLength = 250;
  calculateInterest(vnode)
  //calculateNetworkValue(vnode);
}

function calculateRewardValue(vnode) {
  const astinf = (vnode.state.selected_asset as AssetInfo);
  const d = calcRewards(astinf, vnode.state.switch_mode, vnode.state.stakingAmount, vnode.state.stakingLength, vnode.state.totalbalance.inDollars, vnode.state.staked)
  vnode.state.rewardValue = d.earnings;
  vnode.state.rewardRate = d.rewardRate;
  vnode.state.networkValue = d.networkValue;
  vnode.state.adjustedReward = d.adjustedReward;
  
}

function calcRewards(astinf: AssetInfo, compound: boolean, stakingAmount: number, stakingLength: number, totalSupply: number, stakedSupply: number) {
  
  // hardcoded constants
  
  /* test constants 
  let currentStakedPercent = 0.6533;
  astinf.calculatedInterestRate = 0.052;
  astinf.rewardFrequencyHours = 24;
  totalSupply = 8102224;
  stakedSupply = currentStakedPercent * totalSupply; 
  */

  // for non compounding simple version
  let earningsAtEnd = stakingAmount + (stakingAmount * astinf.calculatedInterestRate * (stakingLength/365));
  let endTotalSupply = totalSupply + (stakedSupply * astinf.calculatedInterestRate * (365/365));
  let currentNetworkShare = stakingAmount/totalSupply;  
  let endNetworkShare = earningsAtEnd/endTotalSupply;
  let diffNetworkShare = endNetworkShare - currentNetworkShare;
  let adjustedReward = diffNetworkShare*(endTotalSupply/stakingAmount) * 100;
  
  if (compound) {
    console.log("running compound!")
    // compound mode
    let compoundInterestRate = Math.pow(1+astinf.calculatedInterestRate/365,365)-1;
    let compoundEndEarnings = stakingAmount*Math.pow((1+compoundInterestRate),(stakingLength/365));
    let compoundEndSupply = endTotalSupply - earningsAtEnd + compoundEndEarnings;
    endNetworkShare = compoundEndEarnings/compoundEndSupply;
    diffNetworkShare = endNetworkShare - currentNetworkShare;
    adjustedReward = diffNetworkShare*(compoundEndSupply/stakingAmount) * 100;
    earningsAtEnd = compoundEndEarnings;
  }
  let earnings = earningsAtEnd - stakingAmount
  let rewardRate = (earnings / stakingAmount) * 100;
  earnings = (earnings - (earnings * astinf.commission));

  currentNetworkShare = currentNetworkShare * 100;
  if(currentNetworkShare > 100){
    currentNetworkShare = 100;
  }
  console.log('networkValue: ', currentNetworkShare);
  console.log('adjustedReward: ', adjustedReward);
  console.log('earnings: ', earnings);
  console.log('rewardRate: ', rewardRate);

  return {
    earnings: earnings,
    rewardRate: rewardRate,
    networkValue: currentNetworkShare*100,
    adjustedReward: adjustedReward
  }
}

function calculateInterest(vnode) {
  const astinf = (vnode.state.selected_asset as AssetInfo);
  const iLeft = astinf.consts.minInflationRate + ((vnode.state.selected_rate / 100) * (astinf.consts.idealInterestRate - (astinf.consts.minInflationRate / astinf.consts.idealStakeRate)));
  const iRight = astinf.consts.minInflationRate + (((astinf.consts.idealInterestRate * astinf.consts.idealStakeRate) - astinf.consts.minInflationRate) * (Math.pow(2, (((astinf.consts.idealStakeRate - (vnode.state.selected_rate / 100)) / astinf.consts.decayRate)))))
  astinf.calculatedInterestRate = Math.min(iLeft, iRight);
  //console.log('calculatedInterestRate', astinf.calculatedInterestRate)
  calculateRewardValue(vnode);
}

function calculateNetworkValue(vnode) {
  vnode.state.networkValue = (vnode.state.stakingAmount / vnode.state.totalbalance.inDollars) * 100;
  vnode.state.networkValue = vnode.state.networkValue > 100 ? 100 : vnode.state.networkValue;
}

const StakingCalculatorPage = makeDynamicComponent<IPreHeaderAttrs, IPreHeaderState>({

  oncreate: async (vnode) => {
    vnode.state.totalStaked = undefined;
    vnode.state.totalbalance = undefined;
    vnode.state.staked = -1;
    mixpanel.track('PageVisit', { 'Page Name': 'StakingCalculatorPage' });
  },
  getObservables: (attrs) => ({
    // we need a group key to satisfy the dynamic object constraints, so here we use the chain class
    groupKey: app.chain && app.chain.apiInitialized ? app.chain.class.toString() : null,
    validators: app.chain && app.chain.apiInitialized ? ((app.chain.base === ChainBase.Substrate) ? (app.chain as Substrate).staking.validators : null) : null,
    sessionInfo: app.chain && app.chain.apiInitialized ? ((app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.sessionInfo
      : null) : null
  }),
  view: (vnode) => {
    const { validators, sessionInfo } = vnode.state.dynamic;

    if (!app.chain || !app.chain.apiInitialized || !validators || !sessionInfo) return m(PageLoading, { message: 'Chain is loading...' });

    if (assets_list.length == 0) {
      assets_list = app.config.nodes.getAll().map(n => {
        const cc = CHAIN_CONST.filter(q => q.symbol.toUpperCase() == n.chain.symbol.toUpperCase())[0];
        return {
          name: n.chain.network,
          sym: n.chain.symbol,
          icon: n.chain.iconUrl,
          usd_value: NaN,
          consts: cc ? cc.const : undefined,
          calculatedInterestRate: 0,
          commission: 0.0,
          rewardFrequencyHours: n.chain.symbol.toUpperCase() == 'KSM' ? 24 : 6
        }
      })
        .filter(unique)

      assets_list.forEach(ast => {
        setTimeout(() => {
          try {
            get('/getUSDvalue?chain_symbol=' + ast.sym, {}, (result) => {
              try {
                ast.usd_value = Number(result.data[0].bid);
              } catch (e) {
                ast.usd_value = NaN;
                console.error('stakingcalculator', 'Unable to fetch USD value for ' + ast.sym)
              }
            })
          } catch (e) {
            ast.usd_value = NaN;
          }
        }, 10)
      })
    }

    if (!vnode.attrs.chain) {
      vnode.attrs.chain = app.chain.meta.chain;
    }
    if (!vnode.state.selected_asset) {
      vnode.state.selected_asset = assets_list.filter(a => a.name.toLowerCase() === app.chain.meta.chain.network.toLowerCase())[0];
    }

    if (vnode.state.totalStaked == undefined) {
      vnode.state.totalStaked = (app.chain as Substrate).chain.coins(0);

      Object.entries(validators).forEach(([_stash, { exposure, isElected }]) => {
        const valStake = (app.chain as Substrate).chain.coins(exposure?.total.toBn())
          || (app.chain as Substrate).chain.coins(0);
        vnode.state.totalStaked = (app.chain as Substrate).chain.coins(vnode.state.totalStaked.asBN.add(valStake.asBN));
      });
      vnode.state.totalbalance = (app.chain as Substrate).chain.totalbalance;

      vnode.state.staked = (vnode.state.totalStaked.muln(10000).div(vnode.state.totalbalance).toNumber() / 100);

      console.log('staked: ', vnode.state.staked)
      vnode.state.selected_rate = vnode.state.staked;
      resetValues(vnode);
    }

    if (vnode.state.staked === -1) return m(PageLoading, { message: 'Calculating Current Staked Value...' });


    return m(Sublayout, {
      class: 'StakingCalculatorPage',
      showNewProposalButton: true,
    }, [
      m(Grid, {
        class: 'staking_calc_wrpr'
      }, [m(".staking-heading .row", m("h4", "Staking Calculator")), m(".title_div .row", [],

        m(".select-asset .col", [m("span.thead", "SELECT ASSET"),

        m(SelectList, {
          class: 'AssetSelectList',
          filterable: false,
          checkmark: false,
          emptyContent: null,
          inputAttrs: {
            class: 'AssetSelectRow',
          },
          popoverAttrs: {
            hasArrow: false
          },
          itemRender: (item: AssetInfo) => {
            return m(ListItem, {
              label: item.name.substr(0, 1).toUpperCase() + item.name.substr(1, item.name.length - 1),
              contentLeft: [m("img", { src: item.icon, class: 'asset-list-icon' })],
              selected: (vnode.state.selected_asset === item),
            });
          },
          items: assets_list,
          trigger:
            m("Button", {
              class: "cui-button cui-align-left cui-compact compact-dropdown",
              label: vnode.state.selected_asset ? vnode.state.selected_asset.name.substr(0, 1).toUpperCase() + vnode.state.selected_asset.name.substr(1, vnode.state.selected_asset.name.length - 1) : "Select Asset"
            }
              , [m("img", { class: "select-list-button-image", src: vnode.state.selected_asset.icon }), m("span.asset-button-label", vnode.state.selected_asset ? vnode.state.selected_asset.name.substr(0, 1).toUpperCase() + vnode.state.selected_asset.name.substr(1, vnode.state.selected_asset.name.length - 1) : "Select Asset"), m('span.dropdown-box', m(".cui-icon .cui-icon-chevron-down", [m("svg", { viewBox: "0 0 24 24" }, m("polyline", { points: "6 9 12 15 18 9" }))]))])

          ,
          onSelect: (item: AssetInfo) => {
            vnode.state.selected_asset = item;
            console.log(item.usd_value)
            m.redraw();
          }
        })

        ]),

        m(".select-asset .col", [m("span.thead", "ENTER STAKING AMOUNT"), m(Input, {
          fluid: true,
          name: 'stake_amt',
          id: 'stake_amt',
          placeholder: 'Amount',
          type: 'tel',
          autocomplete: 'off',
          defaultValue: vnode.state.stakingAmount.toString(),
          onkeyup: (e) => {
            vnode.state.stakingAmount = Number((e.target as any).value)
            calculateNetworkValue(vnode);
            calculateRewardValue(vnode);
          },
          contentRight: m(Tag, { label: vnode.state.selected_asset ? vnode.state.selected_asset.sym : "--", id: 'stake-sym-tag' })
        })
        ]),
        m(".select-asset .col", [m("span.thead", "ENTER STAKING LENGTH"), m(Input, {
          fluid: true,
          name: 'stake_days',
          placeholder: 'Amount',
          autocomplete: 'off',
          defaultValue: vnode.state.stakingLength.toString(),
          type: 'tel',
          onkeyup: (e) => {
            vnode.state.stakingLength = Number((e.target as any).value)
            calculateRewardValue(vnode);
          },
          contentRight: m(Tag, { "label": "Days" })
        })
        ]),
        m(".select-asset .col", [m("span.thead", "STAKING RATE: ", [m("span#rate-val", (vnode.state.selected_rate ? +vnode.state.selected_rate : 0) + '%')]), m(Input, {
          fluid: true,
          name: 'stake_rate',
          type: 'range',
          min: "0.01",
          max: "100",
          step: "0.01",
          value: vnode.state.selected_rate,
          id: 'stake_rate-range-selector',
          defaultValue: (vnode.state.staked ? vnode.state.staked : 0).toString(),
          oninput: (e) => {
            vnode.state.selected_rate = e.target.value;
            calculateInterest(vnode);
          }
        })
        ]),

        m(".select-asset-switch .col", [m("span.thead_switch", "REINVEST?"), m(Switch, {
          fluid: true,
          label: vnode.state.switch_mode ? "YES" : "NO",
          checked: vnode.state.switch_mode,
          onchange: (e) => {
            vnode.state.switch_mode = !vnode.state.switch_mode
            calculateInterest(vnode);
          }
        })
        ]),

        m(".select-asset-edg .col", [m("span.thead", vnode.state.selected_asset.sym.toUpperCase() + " PRICE"), m("div", (vnode.state.selected_asset.usd_value ? formatNumberShort(vnode.state.selected_asset.usd_value) : '--') + ' USD')
        ])
      )

      ]),
      m(Grid, {
        class: 'staking_calc_wrpr_2'
      }, [
        m(".titlewithnumber_div", [m("span", "CURRENT HOLDING VALUE"), m("label", formatNumberShort(vnode.state.stakingAmount) + ' ' + vnode.state.selected_asset.sym.toUpperCase()), m("span"), m("label.bracket", "(" + formatNumberShort(vnode.state.stakingAmount * vnode.state.selected_asset.usd_value) + " USD)")]),
        m(".titlewithnumber_div", [m("span", "REWARD VALUE"), m("label", formatNumberShort(vnode.state.rewardValue) + ' ' + vnode.state.selected_asset.sym.toUpperCase()), m("span"), m("label.bracket", "(" + formatNumberShort(vnode.state.rewardValue * vnode.state.selected_asset.usd_value) + " USD)")]),
        m(".titlewithnumber_div", [m("span.column-below", "REWARD RATE"), m("label", formatNumberShort(vnode.state.rewardRate) + '%')]),
        m(".titlewithnumber_div", [m("span.column-below", "REWARD FREQUENCY"), m("label", formatDuration(moment.duration(moment().add(vnode.state.selected_asset.rewardFrequencyHours, 'hours').diff(moment())), false))]),
        m(".titlewithnumber_div", [m("span.column-below", "NETWORK VALUE"), m("label", ((vnode.state.networkValue > 0 && vnode.state.networkValue < 100.0) ? vnode.state.networkValue.toFixed(6) : vnode.state.networkValue) + '%')]),
        m(".titlewithnumber_div", [m("span.column-below", "ADJUSTED REWARD"), m("label", formatNumberShort(vnode.state.adjustedReward) + '%')])
      ]),

      m(Grid, {
        class: 'staking_calc_wrpr'
      }, [m(".row.title-row", [m(".title-div.col-xs-12", m("h5", "Returns"))]),
      m(".row.content-row", [
        m(CalculatorReturnsContent, {
          rateInHour: 24, // 1 day = 24 hours
          astinf: vnode.state.selected_asset,
          switch_mode: vnode.state.switch_mode,
          stakingAmount: vnode.state.stakingAmount,
          stakingLength: 1, // 1 Day
          class_val: '',
          inventory_coins: vnode.state.totalbalance.inDollars,
          staked_supply: vnode.state.staked
        }),
        m(CalculatorReturnsContent, {
          rateInHour: 744, // 24 * 31 (hour * days)
          astinf: vnode.state.selected_asset,
          switch_mode: vnode.state.switch_mode,
          stakingAmount: vnode.state.stakingAmount,
          stakingLength: 30, // 1 Month
          class_val: '.borderleft_right',
          inventory_coins: vnode.state.totalbalance.inDollars,
          staked_supply: vnode.state.staked
        }),
        m(CalculatorReturnsContent, {
          rateInHour: 8928, // 24 * 31 * 12 (hour * days * years)
          astinf: vnode.state.selected_asset,
          switch_mode: vnode.state.switch_mode,
          stakingAmount: vnode.state.stakingAmount,
          stakingLength: 365, // 1 Year
          class_val: '',
          inventory_coins: vnode.state.totalbalance.inDollars,
          staked_supply: vnode.state.staked
        })
      ]),

      m(".row.button-row", m(".col-xs-12", m(Button, {
        align: 'center', compact: true, label: 'Reset values to default',
        onclick: (e) => {
          resetValues(vnode);

        }
      })))
      ]
      )
    ]);
  }
});


const CalculatorReturnsContent: m.Component<{
  rateInHour: number
  astinf: AssetInfo
  switch_mode: boolean
  stakingAmount: number
  stakingLength: number
  class_val: string
  inventory_coins: number
  staked_supply: number

}, {}> = {
  view: (vnode) => {
    const duration = (formatDuration(moment.duration(moment().add(vnode.attrs.rateInHour, 'hours').diff(moment())), false));
    const d = calcRewards(vnode.attrs.astinf, vnode.attrs.switch_mode, vnode.attrs.stakingAmount, vnode.attrs.stakingLength, vnode.attrs.inventory_coins, vnode.attrs.staked_supply)
    return m(`.returns_content_div.col-lg-4${vnode.attrs.class_val}`, [
      m("strong", `${duration} @ ${formatNumberShort(d.rewardRate)} %`),
      m("p", `${formatNumberShort(d.earnings)} EDG`),
      m("span", `($ ${vnode.attrs.astinf.usd_value ? formatNumberShort(d.earnings * vnode.attrs.astinf.usd_value) : '--'})`)])
  }
}

export default StakingCalculatorPage;
