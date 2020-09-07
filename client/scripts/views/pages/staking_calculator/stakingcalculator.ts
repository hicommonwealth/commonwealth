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
import { Grid, Col, Button, Input, Form, FormGroup, PopoverMenu, MenuItem, Icon, Icons, Tag, Switch, Select, SelectList, ListItem } from 'construct-ui';
import { ICommissionInfo } from 'controllers/chain/substrate/staking';
import { makeDynamicComponent } from 'models/mithril';
import { ChainBase } from 'models';
import { ChainInfo, CommunityInfo } from 'models';
import { stringList } from 'aws-sdk/clients/datapipeline';

interface IPreHeaderState {
  dynamic: {
    validators: IValidators;
    sessionInfo: DeriveSessionProgress;
  },
  selected_asset: AssetInfo;
  selected_rate: number;
  switch_mode: boolean;
  usd_price: string;
}

interface IPreHeaderAttrs {
  sender: SubstrateAccount;
  annualPercentRate: ICommissionInfo;
  chain: ChainInfo;
}
const offence = {
  count: null,
  setCount(offences) {
    offence.count = offences.length;
    m.redraw();
  }
};

class AssetInfo {
  name: string
  sym: string
  icon: string
}

let assets_list: AssetInfo[] = [
]

const unique = (value, index, self) => {
  return self.map(s => s.name).indexOf(value.name) === index
}

const StakingCalculatorPage = makeDynamicComponent<IPreHeaderAttrs, IPreHeaderState>({

  oncreate: async (vnode) => {
    vnode.state.selected_rate = 13.3;
    vnode.state.switch_mode = true;
    const offences = await app.chainEvents.offences();
    offence.setCount(offences);
    mixpanel.track('PageVisit', { 'Page Name': 'StakingCalculatorPage' });
  },
  getObservables: (attrs) => ({
    // we need a group key to satisfy the dynamic object constraints, so here we use the chain class
    groupKey: app.chain.class.toString(),
    validators: (app.chain.base === ChainBase.Substrate) ? (app.chain as Substrate).staking.validators : null,
    sessionInfo: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.sessionInfo
      : null
  }),
  view: (vnode) => {

    if (!app.chain) return m(PageLoading, { message: 'Chain is loading...' });

    if (assets_list.length == 0) {
      assets_list = app.config.nodes.getAll().map(n => {
        return {
          name: n.chain.network.substr(0, 1).toUpperCase() + n.chain.network.substr(1, n.chain.network.length - 1),
          sym: n.chain.symbol,
          icon: n.chain.iconUrl
        }
      })
        .filter(unique)
    }
    if (!vnode.attrs.chain) {
      vnode.attrs.chain = app.chain.meta.chain;
    }
    if (!vnode.state.selected_asset) {
      vnode.state.selected_asset = assets_list.filter(a => a.name.toLowerCase() === app.chain.meta.chain.network)[0];

    }
    const { validators, sessionInfo } = vnode.state.dynamic;
    const { sender, annualPercentRate } = vnode.attrs;
    if (!validators && !sessionInfo) return;

    let totalPercentage = 0.0;
    if (annualPercentRate) {
      Object.entries(annualPercentRate).forEach(([key, value]) => {
        totalPercentage += Number(value);
      });
    }

    const denominator = Object.keys(annualPercentRate || {}).length || 1;
    const apr = (totalPercentage / denominator).toFixed(2);
    const { validatorCount, currentEra,
      currentIndex, sessionLength,
      sessionProgress, eraLength,
      eraProgress, isEpoch } = sessionInfo;

    const nominators: string[] = [];
    let elected: number = 0;
    let waiting: number = 0;
    let totalStaked = (app.chain as Substrate).chain.coins(0);
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
      totalStaked = (app.chain as Substrate).chain.coins(totalStaked.asBN.add(valStake.asBN));

      // count total nominators
      const others = exposure?.others || [];
      others.forEach((indv) => {
        const nominator = indv.who.toString();
        if (!nominators.includes(nominator)) {
          nominators.push(nominator);
        }
      });
      // count elected and waiting validators
      if (isElected) {
        elected++;
      } else {
        waiting++;
      }
    });
    const totalbalance = (app.chain as Substrate).chain.totalbalance;
    const staked = `${(totalStaked.muln(10000).div(totalbalance).toNumber() / 100).toFixed(2)}%`;
    console.log('staked: ', staked)

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
              label: item.name,
              contentLeft: [m("img", { src: item.icon, class: 'asset-list-icon' })],
              selected: (vnode.state.selected_asset === item),
            });
          },
          items: assets_list,
          trigger:
            m("Button", {
              class: "cui-button cui-align-left cui-compact",
              label: vnode.state.selected_asset ? vnode.state.selected_asset.name : "NA"
            }
              , [m("img", { class: "select-list-button-image", src: vnode.state.selected_asset.icon }), m("span.asset-button-label", vnode.state.selected_asset ? vnode.state.selected_asset.name : "NA"), m(".cui-icon .cui-icon-chevron-down", [m("svg", { viewBox: "0 0 24 24" }, m("polyline", { points: "6 9 12 15 18 9" }))])]
            )

          // m(".AssetSelectListButton", [m("img", { class: "select-list-button-image", src: vnode.state.selected_asset.icon }), m(".select-list-button", m(Button, {
          //   align: 'left',
          //   compact: true,
          //   iconRight: Icons.CHEVRON_DOWN,
          //   // iconLeft: Icons.SETTINGS,
          //   label: vnode.state.selected_asset
          //     ? vnode.state.selected_asset.name
          //     : 'Select Asset',
          // }))])


          ,
          onSelect: (item: AssetInfo) => {
            vnode.state.selected_asset = item;
            m.redraw();
          }
        })

        ]),

        m(".select-asset .col", [m("span.thead", "ENTER STAKING AMOUNT"), m(Input, {
          fluid: true,
          name: 'stake_amt',
          placeholder: 'Enter Amount',
          autocomplete: 'off',
          onclick: (e) => {
            e.stopPropagation();
          },
          contentRight: m(Tag, { label: vnode.state.selected_asset ? vnode.state.selected_asset.sym : "--", id: 'stake-sym-tag' })
        })
        ]),
        m(".select-asset .col", [m("span.thead", "ENTER STAKING LENGTH"), m(Input, {
          fluid: true,
          name: 'stake_days',
          placeholder: 'Enter Amount',
          autocomplete: 'off',
          onclick: (e) => {
            e.stopPropagation();
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
          defaultValue: (vnode.state.selected_rate ? vnode.state.selected_rate : 0).toString(),
          oninput: (e) => {
            vnode.state.selected_rate = e.target.value;
          }
        })
        ]),

        m(".select-asset-switch .col", [m("span.thead", "REINVEST?"), m(Switch, {
          fluid: true,
          label: vnode.state.switch_mode ? "YES" : "NO",
          checked: vnode.state.switch_mode,
          onchange: (e) => { vnode.state.switch_mode = !vnode.state.switch_mode }
        })
        ]),

        m(".select-asset-edg .col", [m("span.thead", "EDG PRICE"), m("div", '123 USD')
        ])
      )

      ]),
      m(Grid, {
        class: 'staking_calc_wrpr'
      }, [
        m(".titlewithnumber_div", [m("span", "CURRENT HOLDING VALUE"), m("label", '500 EDG'), m("span"), m("label", "(3250 USD)")]),
        m(".titlewithnumber_div", [m("span", "REWARD VALUE"), m("label", '18.3 EDG'), m("span"), m("label", "(119.27 USD)")]),
        m(".titlewithnumber_div", [m("span", "REWARD RATE"), m("label", '3.3%')]),
        m(".titlewithnumber_div", [m("span", "REWARD FREQUENCY"), m("label", '1 day')]),
        m(".titlewithnumber_div", [m("span", "NETWORK VALUE"), m("label", '0.0134%')]),
        m(".titlewithnumber_div", [m("span", "ADJUSTED REWARD"), m("label", '0.70%')])
      ]),

      m(Grid, {
        class: 'staking_calc_wrpr'
      }, [m(".title_div", [m("h5", "Returns")]),
      m(".returns_content_div", [m("strong", "1 Day @ 0.071%"), m("p", "0.098 EDG"), m("span", "($0.70)")]),
      m(".returns_content_div .borderleft_right", [m("strong", "1 Month @ 0.071%"), m("p", "0.098 EDG"), m("span", "($0.70)")]),
      m(".returns_content_div", [m("strong", "1 Year @ 0.071%"), m("p", "0.098 EDG"), m("span", "($0.70)")])
      ]
      )
    ]);
  }
});


export default StakingCalculatorPage;
