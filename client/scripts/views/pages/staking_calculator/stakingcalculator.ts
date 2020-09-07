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


interface IPreHeaderState {
  dynamic: {
    validators: IValidators;
    sessionInfo: DeriveSessionProgress;
  },
}

class AssetInfo {
  name: string
  sym: string
}

const assets_list: AssetInfo[] = [
  { name: "Edgeware", sym: "EDG" },
  { name: "Kusama", sym: "KSM" },
  { name: "SomethingElse", sym: "STE" },
]

const StakingCalculatorPage: m.Component<{}, { selected_asset: AssetInfo, selected_rate: number }> = {

  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'StakingCalculatorPage' });
    vnode.state.selected_rate = 13.3;
    vnode.state.selected_asset = assets_list[0];
  },
  view: (vnode) => {
    if (!app.chain || !app.chain.loaded) return m(PageLoading, { message: 'Connecting to chain...', title: 'Staking Calculator' });

    return m(Sublayout, {
      class: 'StakingCalculatorPage',
      title: 'Staking Calulator',
      showNewProposalButton: true,
    }, [
      m(Grid, {
        class: 'staking_calc_wrpr'
      }, [m(".title_div", [m("h4", "Staking Calculator")],

        m(".select-asset", [m("label", "SELECT ASSET"),
        //  m(Select, {
        //   onchange: (e: Event) => {
        //     ctrl.selected_val = (e.target as any).value
        //     ctrl.doSomething();
        //   },
        //   id: 'id-asset-select',
        //   options: ctrl.opts,
        //   defaultValue: ctrl.selected_val
        // })


        m(SelectList, {
          class: 'AssetSelectList',
          filterable: false,
          checkmark: false,
          emptyContent: null,
          inputAttrs: {
            class: 'AssetSelectRow',
          },
          itemRender: (item: AssetInfo) => {
            return m(ListItem, {
              label: item.name,
              selected: (vnode.state.selected_asset === item),
            });
          },
          items: assets_list,
          trigger: m(Button, {
            align: 'left',
            compact: true,
            iconRight: Icons.CHEVRON_DOWN,
            label: vnode.state.selected_asset
              ? vnode.state.selected_asset.name
              : 'Select Asset',
          }),
          onSelect: (item: AssetInfo) => {
            vnode.state.selected_asset = item;
            m.redraw();
          }
        })

        ]),

        m(".select-asset", [m("label", "ENTER STAKING AMOUNT"), m(Input, {
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
        m(".select-asset", [m("label", "ENTER STAKING LENGTH"), m(Input, {
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
        m(".select-asset", [m("label", "STAKING RATE", [m("#rate-val", (vnode.state.selected_rate ? +vnode.state.selected_rate : 0) + '%')]), m(Input, {
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

        m(".select-asset", [m("label", "REINVEST?"), m(Switch, {
          fluid: true,

        })
        ]),

        m(".select-asset", [m("label", "EDG PRICE"), m("label", '123 USD')
        ])
      )

      ]),
      m(Grid, {
        class: 'staking_calc_wrpr'
      }, [
        m(".titlewithnumber_div", [m("span", "CURRENT HOLDING VALUE"), m("label", '500 EDG (3250 USD)')]),
        m(".titlewithnumber_div", [m("span", "REWARD VALUE"), m("label", '18.3 EDG (119.27 USD)')]),
        m(".titlewithnumber_div", [m("span", "REWART RATE"), m("label", '3.3%')]),
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
};

export default StakingCalculatorPage;
