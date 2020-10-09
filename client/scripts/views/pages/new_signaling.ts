import 'pages/new_signaling.scss';

import m from 'mithril';
import $ from 'jquery';
import mixpanel from 'mixpanel-browser';
import {
  Grid, Col, Classes, ButtonGroup, Callout, Form, FormGroup,
  FormLabel, Button, Icon, Icons, Radio, RadioGroup, Tag, Input, TextArea
} from 'construct-ui';
import app from 'state';

import { symbols, formatDuration, blockperiodToDuration } from 'helpers';
import { formatCoin } from 'adapters/currency';
import Edgeware from 'controllers/chain/edgeware/main';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { notifyInfo } from 'controllers/app/notifications';

import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import User from 'views/components/widgets/user';
import { createTXModal } from 'views/modals/tx_signing_modal';
import { ChainClass, ChainNetwork } from 'models';
import Substrate from 'controllers/chain/substrate/main';

export interface ISignalingPageState {
  voteOutcomes: any[];
  voteType: 'binary' | 'multioption' | 'rankedchoice';
  tallyType: 'onecoin' | 'oneperson';
  form: any;
  error: string;
}

export interface IBinaryOptionState {
  first: string | number;
  second: string | number;
}

async function loadCmd() {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (app.chain.network !== ChainNetwork.Edgeware) {
    return;
  }
  const chain = (app.chain as Substrate);
  await chain.signaling.init(chain.chain, chain.accounts);
}

export const NewSignalingPage: m.Component<{}, ISignalingPageState> = {
  oninit: (vnode) => {
    vnode.state.voteOutcomes = ['Yes', 'No'];
    vnode.state.voteType = 'binary';
    vnode.state.tallyType = 'onecoin';
    mixpanel.track('PageVisit', {
      'Page Name': 'NewSignalingPage',
      'Scope': app.activeId(),
    });
  },
  view: (vnode) => {
    if (!app.isLoggedIn()) {
      m.route.set(`/${app.activeChainId()}/login`, {}, { replace: true });
      return m(PageLoading, { showNewProposalButton: true });
    }
    if (!app.chain || !app.chain.loaded) {
      return m(PageLoading, { showNewProposalButton: true });
    }
    if (app.chain && app.chain.class !== ChainClass.Edgeware) {
      notifyInfo('Can only create signaling proposals on Edgeware');
      m.route.set(`/${app.activeChainId()}/discussions`);
      return;
    }
    if (!(app.chain as Substrate).signaling.disabled && !(app.chain as Substrate).signaling.initialized) {
      if (!(app.chain as Substrate).signaling.initializing) loadCmd();
      return m(PageLoading);
    }

    const author = app.user.activeAccount;
    const newThread = () => {
      if (!vnode.state.form.title || !vnode.state.form.description) {
        vnode.state.error = 'Both title and description are required.';
        return;
      }
      mixpanel.track('Create Thread', {
        'Step No': 2,
        'Step' : 'Submit Proposal',
        'Proposal Type': 'Signaling',
        'Thread Type': 'Proposal',
      });
      vnode.state.error = null;
      createTXModal((app.chain as Edgeware).signaling.createTx(
        author as SubstrateAccount,
        vnode.state.form.title,
        vnode.state.form.description,
        vnode.state.voteOutcomes,
        vnode.state.voteType,
        vnode.state.tallyType,
      )).then(() => {
        // TODO: get the returned proposal ID, and go straight to the proposal page
        m.route.set(`/${app.activeChainId()}/proposals`);
        m.redraw();
      }).catch((err : any) => {
        vnode.state.error = err.message;
        m.redraw();
      });
    };

    // init;
    if (!vnode.state.form) {
      vnode.state.form = {};
    }

    const span = {
      xs: 12,
      sm: 12,
      md: 7,
    };

    return m(Sublayout, {
      class: 'NewSignalingPage',
      title: 'New Signaling Proposal',
      showNewProposalButton: true,
    }, [
      m('.forum-container', [
        m(Grid, [
          m(Col, { span }, [
            !app.user.activeAccount
              ? m(Callout, {
                icon: Icons.ALERT_TRIANGLE,
                intent: 'primary',
                content: 'Connect an address to create a signaling proposal.'
              })
              : m(Callout, {
                icon: Icons.INFO,
                header: 'Create signaling proposal',
                content: [
                  m('div', `Refundable bond: ${formatCoin((app.chain as Edgeware).signaling.proposalBond)} `),
                  m('div', 'Voting period: '
                    + `${formatDuration(blockperiodToDuration((app.chain as Edgeware).signaling.votingPeriod))}`),
                ]
              }),
            m('br'),
            m(Form, [
              m(FormGroup, [
                m(Input, {
                  name: 'title',
                  placeholder: 'Ask a question...',
                  disabled: !author,
                  autocomplete: 'off',
                  oninput: (e) => {
                    vnode.state.form.title = (e.target as any).value;
                  }
                }),
              ]),
              m(FormGroup, [
                m(TextArea, {
                  name: 'description',
                  placeholder: 'Add a description',
                  disabled: !author,
                  oninput: (e) => {
                    vnode.state.form.description = (e.target as any).value;
                  },
                }),
              ]),
              m(FormGroup, [
                m(FormGroup, [
                  m(RadioGroup, {
                    value: vnode.state.voteType,
                    disabled: !app.user.activeAccount,
                    options: [{
                      label: 'Binary',
                      value: 'binary',
                      disabled: vnode.state.voteOutcomes.length > 2,
                    }, {
                      label: 'Multi Option',
                      value: 'multioption',
                      disabled: vnode.state.voteOutcomes.length <= 2,
                    }, {
                      label: 'Ranked Choice',
                      value: 'rankedchoice',
                      disabled: vnode.state.voteOutcomes.length <= 2,
                    }],
                    onchange: (e) => {
                      vnode.state.voteType = (e.target as any).value;
                      if (vnode.state.voteType === 'binary') {
                        vnode.state.voteOutcomes = ['Yes', 'No'];
                      } else {
                        while (vnode.state.voteOutcomes.length < 3) vnode.state.voteOutcomes.push('');
                      }
                    }
                  }),
                ]),
                vnode.state.voteOutcomes.map((outcome, index) => m(FormGroup, [ m(Input, {
                  defaultValue: outcome,
                  disabled: !app.user.activeAccount || vnode.state.voteType === 'binary',
                  contentLeft: m(Tag, { label: `Option ${index + 1}` })
                }) ])),
                m(ButtonGroup, { fluid: true }, [
                  m(Button, {
                    iconLeft: Icons.PLUS,
                    label: 'Add option',
                    disabled: vnode.state.voteType === 'binary' || vnode.state.voteOutcomes.length === 6,
                    onclick: () => {
                      if (vnode.state.voteOutcomes.length >= 6) return;
                      vnode.state.voteOutcomes.push('');
                    }
                  }),
                  m(Button, {
                    iconLeft: Icons.MINUS,
                    label: 'Remove option',
                    disabled: vnode.state.voteType === 'binary' || vnode.state.voteOutcomes.length === 3,
                    onclick: () => {
                      if (vnode.state.voteOutcomes.length <= 3) return;
                      vnode.state.voteOutcomes.splice(vnode.state.voteOutcomes.length - 1);
                    }
                  }),
                ]),
              ]),
              m(FormGroup, [
                m(Button, {
                  intent: 'primary',
                  disabled: !author,
                  onclick: (e) => newThread(),
                  label: 'Create proposal',
                }),
              ]),
            ]),
            vnode.state.error && m('.error-message', vnode.state.error),
          ]),
        ]),
      ]),
    ]);
  }
};

export default NewSignalingPage;
