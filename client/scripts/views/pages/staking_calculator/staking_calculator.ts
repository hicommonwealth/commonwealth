import 'pages/staking_calculator.scss'
import m from 'mithril'
import mixpanel from 'mixpanel-browser'
import app from 'state'
import Sublayout from 'views/sublayout'
import PageLoading from 'views/pages/loading'
import Substrate from 'controllers/chain/substrate/main'
import { IValidators } from 'controllers/chain/substrate/account'
import { DeriveSessionProgress } from '@polkadot/api-derive/types'
import { Grid, Button, Input, Tag, Switch, SelectList, ListItem, } from 'construct-ui'
import { makeDynamicComponent } from 'models/mithril'
import { ChainBase } from 'models'
import { SubstrateCoin } from 'adapters/chain/substrate/types'
import { ChainInfo } from 'models'
import { get } from 'lib/util'
import { CHAIN_CONST } from './chain_constants'
import { CalculatorReturnsContent } from '../../components/staking_calculator_returns'
import moment from 'moment-twitter'
import { formatNumberShort, formatDuration, calcRewards, calculateInterestLeftRight } from '../../../helpers/calculator_helper'
import { AssetInfo } from '../../../models/AssetInfo'

interface IStakingCalculatorState {
  dynamic: {
    validators: IValidators
    sessionInfo: DeriveSessionProgress
  }
  selected_asset: AssetInfo
  selectedRate: number
  isCompound: boolean
  usd_price: string
  totalStaked: SubstrateCoin
  stakingAmount: number
  stakingLength: number
  staked: number
  rewardValue: number
  networkValue: number
  adjustedReward: number
  rewardRate: number
}

interface IStakingCaculatorAttrs { chain: ChainInfo }

let assets_list: AssetInfo[] = []
//get unique list based on assetName
const unique = (value, index, self) => { return self.map((s) => s.name).indexOf(value.name) === index }

//default on page load values
function resetValues(vnode) {
  vnode.state.selectedRate = vnode.state.staked
  vnode.state.isCompound = false
  vnode.state.stakingAmount = 10000
  vnode.state.rewardValue = 0
  vnode.state.networkValue = 0
  vnode.state.adjustedReward = 0
  vnode.state.rewardEdgPerDay = 0
  vnode.state.reward_rate = 0
  vnode.state.stakingLength = 250
  calculateInterest(vnode)
  calculateNetworkValue(vnode);
}


function calculateRewardValue(vnode) {
  const astinf = vnode.state.selected_asset as AssetInfo
  const d = calcRewards(astinf, vnode.state.isCompound, vnode.state.stakingAmount, vnode.state.stakingLength, vnode.state.selectedRate)
  vnode.state.rewardValue = d.earnings
  vnode.state.rewardRate = d.rewardRate
  vnode.state.networkValue = d.networkValue
  vnode.state.adjustedReward = d.adjustedReward
}

// get interest = (i) => min of iLeft and iRight 
function calculateInterest(vnode) {
  const astinf = vnode.state.selected_asset as AssetInfo
  const res = calculateInterestLeftRight(astinf, vnode.state.selectedRate)
  astinf.calculatedInterestRate = Math.min(res.left, res.right)
  calculateRewardValue(vnode)
}

function calculateNetworkValue(vnode) {
  vnode.state.networkValue = (vnode.state.stakingAmount / vnode.state.selected_asset.totalSupply) * 100
  vnode.state.networkValue = vnode.state.networkValue > 100 ? 100 : vnode.state.networkValue
}

const StakingCalculatorPage = makeDynamicComponent<IStakingCaculatorAttrs, IStakingCalculatorState>({
  oncreate: async (vnode) => {
    vnode.state.totalStaked = undefined
    vnode.state.staked = -1
    mixpanel.track('PageVisit', { 'Page Name': 'StakingCalculatorPage' })
  },
  getObservables: (attrs) => ({
    groupKey: app.chain && app.chain.apiInitialized ? app.chain.class.toString() : null,
    validators: app.chain && app.chain.apiInitialized ? app.chain.base === ChainBase.Substrate ? (app.chain as Substrate).staking.validators : null : null,
    sessionInfo: app.chain && app.chain.apiInitialized ? app.chain.base === ChainBase.Substrate ? (app.chain as Substrate).staking.sessionInfo : null : null,
  }),
  view: (vnode) => {
    const { validators, sessionInfo } = vnode.state.dynamic

    if (!app.chain || !app.chain.apiInitialized || !validators || !sessionInfo)
      return m(PageLoading, { message: 'Chain is loading...' })

    if (assets_list.length == 0) {
      //populate assets_list
      assets_list = app.config.nodes.getAll().map((n) => {
        const cc = CHAIN_CONST.filter((q) => q.symbol.toUpperCase() == n.chain.symbol.toUpperCase(),)[0]
        return {
          name: n.chain.network,
          sym: n.chain.symbol,
          icon: n.chain.iconUrl,
          usd_value: NaN,
          consts: cc ? cc.const : undefined, calculatedInterestRate: 0,
          commission: 0.0,
          totalSupply: undefined,
          //TODO: add API to getFrequencyHours for asset
          rewardFrequencyMinutes: n.chain.symbol.toUpperCase() == 'KSM' ? 1440 : 360
        }
      }).filter(unique)

      //async add USD value for each chain after list is populated
      assets_list.forEach((ast) => {
        setTimeout(() => {
          try {
            get('/getUSDvalue?chain_symbol=' + ast.sym, {}, (result) => {
              try { ast.usd_value = Number(result.data[0].bid) } catch (e) {
                ast.usd_value = NaN
                console.error('stakingcalculator', 'Unable to fetch USD value for ' + ast.sym,)
              }
            })
          } catch (e) { ast.usd_value = NaN }
        }, 10)

      })
    }
    if (!vnode.attrs.chain) {
      vnode.attrs.chain = app.chain.meta.chain
    }
    // initial select default asset
    if (!vnode.state.selected_asset) {
      vnode.state.selected_asset = assets_list.filter((a) => a.name.toLowerCase() === app.chain.meta.chain.network.toLowerCase(),)[0]
    }

    // calculate staked % for selected/default chain
    // run only once page is loaded and data is populated
    if (vnode.state.totalStaked == undefined) {
      vnode.state.totalStaked = (app.chain as Substrate).chain.coins(0)
      Object.entries(validators).forEach(([_stash, { exposure, isElected }]) => {
        const valStake = (app.chain as Substrate).chain.coins(exposure?.total.toBn()) || (app.chain as Substrate).chain.coins(0)
        vnode.state.totalStaked = (app.chain as Substrate).chain.coins(vnode.state.totalStaked.asBN.add(valStake.asBN),)
      })

      vnode.state.selected_asset.totalSupply = (app.chain as Substrate).chain.totalbalance.inDollars;
      vnode.state.staked = vnode.state.totalStaked.muln(10000).div((app.chain as Substrate).chain.totalbalance).toNumber() / 100
      vnode.state.selectedRate = vnode.state.staked
      resetValues(vnode)
    }

    if (vnode.state.staked === -1)
      return m(PageLoading, { message: 'Calculating Current Staked Value...' })

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
        m(".select-asset .col", [m("span.thead", "STAKING RATE: ", [m("span#rate-val", (vnode.state.selectedRate ? +vnode.state.selectedRate : 0) + '%')]), m(Input, {
          fluid: true,
          name: 'stake_rate',
          type: 'range',
          min: "0.01",
          max: "100",
          step: "0.01",
          value: vnode.state.selectedRate,
          id: 'stake_rate-range-selector',
          defaultValue: (vnode.state.staked ? vnode.state.staked : 0).toString(),
          oninput: (e) => {
            vnode.state.selectedRate = e.target.value;
            calculateInterest(vnode);
          }
        })
        ]),

        m(".select-asset-switch .col", [m("span.thead_switch", "REINVEST?"), m(Switch, {
          fluid: true,
          label: vnode.state.isCompound ? "YES" : "NO",
          checked: vnode.state.isCompound,
          onchange: (e) => {
            vnode.state.isCompound = !vnode.state.isCompound
            calculateInterest(vnode);
          }
        })
        ]),

        m(".select-asset-edg .col", [m("span.thead", vnode.state.selected_asset.sym.toUpperCase() + " PRICE"), m("div", (vnode.state.selected_asset.usd_value ? formatNumberShort(vnode.state.selected_asset.usd_value) : '--') + ' USD')])
      )

      ]),
      m(Grid, {
        class: 'staking_calc_wrpr_2'
      }, [
        m(".titlewithnumber_div", [m("span", "CURRENT HOLDING VALUE"), m("label", formatNumberShort(vnode.state.stakingAmount) + ' ' + vnode.state.selected_asset.sym.toUpperCase()), m("span"), m("label.bracket", "(" + formatNumberShort(vnode.state.stakingAmount * vnode.state.selected_asset.usd_value) + " USD)")]),
        m(".titlewithnumber_div", [m("span", "REWARD VALUE"), m("label", formatNumberShort(vnode.state.rewardValue) + ' ' + vnode.state.selected_asset.sym.toUpperCase()), m("span"), m("label.bracket", "(" + formatNumberShort(vnode.state.rewardValue * vnode.state.selected_asset.usd_value) + " USD)")]),
        m(".titlewithnumber_div", [m("span.column-below", "REWARD RATE"), m("label", formatNumberShort(vnode.state.rewardRate) + '%')]),
        m(".titlewithnumber_div", [m("span.column-below", "REWARD FREQUENCY"), m("label", formatDuration(moment.duration(moment().add(vnode.state.selected_asset.rewardFrequencyMinutes, 'hours').diff(moment())), false))]),
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
          isCompound: vnode.state.isCompound,
          stakingAmount: vnode.state.stakingAmount,
          stakingLength: 1, // 1 Day
          classVal: '',
          selectedRate: vnode.state.selectedRate
        }),
        m(CalculatorReturnsContent, {
          rateInHour: 744, // 24 * 31 (hour * days)
          astinf: vnode.state.selected_asset,
          isCompound: vnode.state.isCompound,
          stakingAmount: vnode.state.stakingAmount,
          stakingLength: 30, // 1 Month
          classVal: '.borderleft_right',
          selectedRate: vnode.state.selectedRate
        }),
        m(CalculatorReturnsContent, {
          rateInHour: 8928, // 24 * 31 * 12 (hour * days * years)
          astinf: vnode.state.selected_asset,
          isCompound: vnode.state.isCompound,
          stakingAmount: vnode.state.stakingAmount,
          stakingLength: 365, // 1 Year
          classVal: '',
          selectedRate: vnode.state.selectedRate
        })
      ]),
      m(".row.button-row", m(".col-xs-12", m(Button, {
        align: 'center', compact: true, label: 'Reset values to default',
        onclick: (e) => {
          resetValues(vnode);

        }
      })))])]);
  },
})
export default StakingCalculatorPage