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
import { Grid, Col, Button, Input, Form, FormGroup, PopoverMenu, MenuItem, Icon, Icons, Tag, Switch, Select } from 'construct-ui';


interface IPreHeaderState {
  dynamic: {
    validators: IValidators;
    sessionInfo: DeriveSessionProgress;
  },
}


const StakingCalculatorPage: m.Component<{}> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'StakingCalculatorPage' });
  },
  view: (vnode) => {
    if (!app.chain || !app.chain.loaded) return m(PageLoading, { message: 'Connecting to chain...', title: 'Staking Calculator' });

    const ctrl = {
      selected_val: "Edgeware",
      selected_sym: "EDG",
      opts: ["Edgeware", "Kusama", "SomethingElse"],
      opts_sym: ["EDG", "KSM", "STE"],
      doSomething: function () {
        console.log("Selected: " + ctrl.selected_val)
        ctrl.selected_sym = ctrl.opts_sym[ctrl.opts.indexOf(ctrl.selected_val)]
        console.log('selected_sym ', ctrl.selected_sym)
        $('#stake-sym-tag').text(ctrl.selected_sym);
        let totalStaked = (app.chain as Substrate).chain.coins(0);
        
        const totalbalance = (app.chain as Substrate).chain.totalbalance;
        const staked = `${(totalStaked.muln(10000).div(totalbalance).toNumber() / 100).toFixed(2)}%`;

        // const { validators, sessionInfo } = vnode.state.dynamic;

        // Object.entries(validators).forEach(([_stash, { exposure, isElected }]) => {
        //   const valStake = (app.chain as Substrate).chain.coins(exposure?.total.toBn())
        //   || (app.chain as Substrate).chain.coins(0);
        //   totalStaked = (app.chain as Substrate).chain.coins(totalStaked.asBN.add(valStake.asBN));
    
        //   // count total nominators
        //   const others = exposure?.others || [];
        //   others.forEach((indv) => {
        //     const nominator = indv.who.toString();
        //     if (!nominators.includes(nominator)) {
        //       nominators.push(nominator);
        //     }
        //   });
        //   // count elected and waiting validators
        //   if (isElected) {
        //     elected++;
        //   } else {
        //     waiting++;
        //   }
        // });
        // const qq = app.chain as Substrate;
        // debugger;
      },
      doSomething1: function () {
        console.log("CurrentVal: " + ctrl.selected_rate)
        $('#rate-val').text(ctrl.selected_rate + '%');
      },
      selected_rate: 13.3
    }
    return m(Sublayout, {
      class: 'StakingCalculatorPage',
      title: 'Staking Calulator',
      showNewProposalButton: true,
    }, [
      m(Grid, {
        class: 'staking_calc_wrpr'
      }, [m(".title_div", [m("h4", "Staking Calculator")],

        m(".select-asset", [m("label", "SELECT ASSET"), m(Select, {
          onchange: (e: Event) => {
            ctrl.selected_val = (e.target as any).value
            ctrl.doSomething();
          },
          id: 'id-asset-select',
          options: ctrl.opts,
          defaultValue: ctrl.selected_val
        })]),

        m(".select-asset", [m("label", "ENTER STAKING AMOUNT"), m(Input, {
          fluid: true,
          name: 'stake_amt',
          placeholder: 'Enter Amount',
          autocomplete: 'off',
          onclick: (e) => {
            e.stopPropagation();
          },

          contentRight: m(Tag, { label: ctrl.selected_sym, id: 'stake-sym-tag' })
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
        m(".select-asset", [m("label", "STAKING RATE", [m("#rate-val", ctrl.selected_rate + '%')]), m(Input, {
          fluid: true,
          name: 'stake_rate',
          type: 'range',
          min: "0.01",
          max: "100",
          step: "0.01",
          defaultValue: ctrl.selected_rate.toString(),
          oninput: (e) => {
            ctrl.selected_rate = e.target.value;
            ctrl.doSomething1();
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
        m(".returns_content_div",[m("strong","1 Day @ 0.071%"),m("p","0.098 EDG"),m("span","($0.70)")]),
        m(".returns_content_div .borderleft_right",[m("strong","1 Month @ 0.071%"),m("p","0.098 EDG"),m("span","($0.70)")]),
        m(".returns_content_div",[m("strong","1 Year @ 0.071%"),m("p","0.098 EDG"),m("span","($0.70)")])
      ]
      )
    ]);
  }
};

export default StakingCalculatorPage;
