import 'pages/staking_calculator.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import app from 'state';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import $ from 'jquery';
import Substrate from 'controllers/chain/substrate/main';
import { SubstrateAccount, IValidators } from 'controllers/chain/substrate/account';
import { DeriveSessionProgress } from '@polkadot/api-derive/types';
import { Grid, Col, Button, Input, Tag, Switch, SelectList, ListItem } from 'construct-ui';
import { ICommissionInfo } from 'controllers/chain/substrate/staking';
import { makeDynamicComponent } from 'models/mithril';
import { ChainBase } from 'models';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import { ChainInfo, CommunityInfo } from 'models';
import { get } from 'lib/util';
import CHAIN_CONST  from './chainconstants'
import ChainConstant from './chainconstants'

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
  rewardEdgPerDay: number
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
  rewardFrequencyDays: number
}

let assets_list: AssetInfo[] = [
]

const unique = (value, index, self) => {
  return self.map(s => s.name).indexOf(value.name) === index
}

function resetValues(vnode){
  vnode.state.selected_rate = vnode.state.staked;
  vnode.state.switch_mode = false;
  vnode.state.stakingAmount = 0;
  vnode.state.rewardValue = 0;  
  vnode.state.networkValue = 0;
  vnode.state.adjustedReward = 0;
  vnode.state.rewardEdgPerDay = 0;
}

const StakingCalculatorPage = makeDynamicComponent<IPreHeaderAttrs, IPreHeaderState>({

  oncreate: async (vnode) => {
    resetValues(vnode);
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
        return {
          name: n.chain.network,
          sym: n.chain.symbol,
          icon: n.chain.iconUrl,
          usd_value: NaN,
          consts: undefined,
          calculatedInterestRate: 0,
          commission: 0.1,
          rewardFrequencyDays: 6
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

    if (vnode.state.totalStaked == undefined)
     {
      vnode.state.totalStaked = (app.chain as Substrate).chain.coins(0);
      let hasClaimablePayouts = false;

      if (app.chain.base === ChainBase.Substrate) {
        (app.chain as Substrate).chain.api.toPromise()
          .then((api) => {
            if (api.query.staking.erasStakers) {
              hasClaimablePayouts = true;
            }
          });
      }
      Object.entries(validators).forEach(([_stash, { exposure, isElected }]) => {
        const valStake = (app.chain as Substrate).chain.coins(exposure?.total.toBn())
          || (app.chain as Substrate).chain.coins(0);
        vnode.state.totalStaked = (app.chain as Substrate).chain.coins(vnode.state.totalStaked.asBN.add(valStake.asBN));
      });
      vnode.state.totalbalance = (app.chain as Substrate).chain.totalbalance;
      vnode.state.staked = (vnode.state.totalStaked.muln(10000).div(vnode.state.totalbalance).toNumber() / 100);

      console.log('staked: ', vnode.state.staked)
      vnode.state.selected_rate = vnode.state.staked;
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
          type:'tel',
          autocomplete: 'off',
          //value: vnode.state.stakingAmount,

          // onclick: (e) => {
          //   // e.stopPropagation();
          //   console.log('click')
          //   vnode.state.stakingAmount = Number((e.target as any).value)
          //  },
           onkeyup:(e)=>{
            vnode.state.stakingAmount = Number((e.target as any).value)
           },
          //  onchange:(e)=>{
          //   vnode.state.stakingAmount = Number((e.target as any).value)
          //    console.log('key presses cc')
          //  },

          contentRight: m(Tag, { label: vnode.state.selected_asset ? vnode.state.selected_asset.sym : "--", id: 'stake-sym-tag' })
        })
        ]),
        m(".select-asset .col", [m("span.thead", "ENTER STAKING LENGTH"), m(Input, {
          fluid: true,
          name: 'stake_days',
          placeholder: 'Amount',
          autocomplete: 'off',
          type:'tel',  
          onkeyup:(e)=>{
            vnode.state.stakingLength = Number((e.target as any).value)
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
          value:vnode.state.selected_rate,
          id: 'stake_rate-range-selector',
          defaultValue: (vnode.state.staked ? vnode.state.staked : 0).toString(),
          oninput: (e) => {
            vnode.state.selected_rate = e.target.value;
          }
        })
        ]),

        m(".select-asset-switch .col", [m("span.thead_switch", "REINVEST?"), m(Switch, {
          fluid: true,
          label: vnode.state.switch_mode ? "YES" : "NO",
          checked: vnode.state.switch_mode,
          onchange: (e) => { vnode.state.switch_mode = !vnode.state.switch_mode }
        })
        ]),

        m(".select-asset-edg .col", [m("span.thead", "EDG PRICE"), m("div", vnode.state.selected_asset.usd_value.toFixed(3) + ' USD')
        ])
      )

      ]),
      m(Grid, {
        class: 'staking_calc_wrpr_2'
      }, [
        m(".titlewithnumber_div", [m("span", "CURRENT HOLDING VALUE"), m("label", vnode.state.stakingAmount ), m("span"), m("label.bracket", "("+(vnode.state.stakingAmount * vnode.state.selected_asset.usd_value).toFixed(3) + " USD)")]),
        m(".titlewithnumber_div", [m("span", "REWARD VALUE"), m("label", vnode.state.rewardValue.toFixed(3)+' EDG'), m("span"), m("label.bracket", "("+(vnode.state.rewardValue *vnode.state.selected_asset.usd_value).toFixed(3) +" USD)")]),
        m(".titlewithnumber_div", [m("span.column-below", "REWARD RATE"), m("label", vnode.state.selected_asset.calculatedInterestRate + '%')]),
        m(".titlewithnumber_div", [m("span.column-below", "REWARD FREQUENCY"), m("label", vnode.state.selected_asset.rewardFrequencyDays +' day' + (vnode.state.selected_asset.rewardFrequencyDays > 1 ? 's' :'') )]),
        m(".titlewithnumber_div", [m("span.column-below", "NETWORK VALUE"), m("label", vnode.state.networkValue.toFixed(3)+'%')]),
        m(".titlewithnumber_div", [m("span.column-below", "ADJUSTED REWARD"), m("label", vnode.state.adjustedReward.toFixed(3)+'%')])
      ]),

      m(Grid, {
        class: 'staking_calc_wrpr'
      }, [m(".row.title-row", [m(".title-div.col-xs-12", m("h5", "Returns"))]),
      m(".row.content-row", [
        m(".returns_content_div.col-lg-4", [m("strong", "1 Day @ "+vnode.state.rewardValue.toFixed()+"%"), m("p", vnode.state.rewardEdgPerDay.toFixed(3)+" EDG"), m("span", "($"+ ((vnode.state.rewardEdgPerDay) *vnode.state.selected_asset.usd_value).toFixed(3)  +")")]),
        m(".returns_content_div .borderleft_right.col-lg-4", [m("strong", "1 Month @ "+vnode.state.rewardValue.toFixed()+"%"), m("p",  (vnode.state.rewardEdgPerDay  * 30) .toFixed(3)+" EDG"), m("span", "($"+ ((vnode.state.rewardEdgPerDay * 30 ) *vnode.state.selected_asset.usd_value).toFixed(3)  +")")]),
        m(".returns_content_div.col-lg-4", [m("strong", "1 Year @ "+vnode.state.rewardValue.toFixed()+"%"), m("p", (vnode.state.rewardEdgPerDay  * 365) .toFixed(3)+" EDG"), m("span", "($"+ ((vnode.state.rewardEdgPerDay * 365 ) *vnode.state.selected_asset.usd_value).toFixed(3)  +")")])
      ])
        ,
      m(".row", m(".col-xs-12", m(Button, { align: 'center', compact: true, label: 'Reset values to default' ,
      onclick: (e)=>{
        resetValues(vnode);
        
      }
      })))
      ]
      )
    ]);
  }
});


export default StakingCalculatorPage;
