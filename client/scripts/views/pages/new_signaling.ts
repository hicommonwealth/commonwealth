import 'pages/new_signaling.scss';

import { default as m } from 'mithril';
import { default as $ } from 'jquery';
import { default as mixpanel } from 'mixpanel-browser';
import app from 'state';

import { symbols, formatDuration, blockperiodToDuration } from 'helpers';
import { formatCoin } from 'adapters/currency';
import Edgeware from 'controllers/chain/edgeware/main';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { notifyInfo } from 'controllers/app/notifications';

import { TextInputFormField, TextareaFormField } from 'views/components/forms';
import User from 'views/components/widgets/user';
import { createTXModal } from 'views/modals/tx_signing_modal';
import SendingFrom from 'views/components/sending_from';
import ObjectPage from 'views/pages/_object_page';
import { ChainClass } from 'models/models';

export interface ISignalingPageState {
  voteOutcomes: any[];
  voteType: string;
  tallyType: string;
  form: any;
  error: string;
  numOutcomes: number;
}

export interface IBinaryOptionState {
  first: string | number;
  second: string | number;
}

export const NewSignalingPage: m.Component<{}, ISignalingPageState> = {
  oninit: (vnode) => {
    vnode.state.numOutcomes = 2;
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
      return;
    }
    if (app.chain.class !== ChainClass.Edgeware) {
      notifyInfo('Can only create signaling proposals on Edgeware');
      m.route.set(`/${app.activeChainId()}/discussions`);
      return;
    }

    const author = app.vm.activeAccount;
    const newThread = () => {
      if (!vnode.state.form.title || !vnode.state.form.description) {
        return vnode.state.error = 'Both title and description are required.';
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

    const proposalOutcomeOptions = [...new Array(vnode.state.numOutcomes)].map((elt, optionInx) => {
      return m(TextInputFormField, {
        options: {
          name: `option ${optionInx}`,
          value: vnode.state.voteOutcomes[optionInx],
          placeholder: `Enter option ${+optionInx + 1}`,
          autocomplete: 'off',
          oncreate: (vnode) => $(vnode.dom).focus(),
        },
        callback: (result) => {
          if (optionInx >= vnode.state.voteOutcomes.length) {
            vnode.state.voteOutcomes.push(result);
          } else {
            vnode.state.voteOutcomes[optionInx] = result;
          }
        }
      });
    });

    return m(ObjectPage, {
      class: 'NewSignalingPage',
      content: app.chain && app.chain.loaded && [
        m('.forum-container', [
          m('h2.page-title', 'New Signaling Proposal'),
          m('.row', [
            m('.new-signaling-right.col-sm-3', [
              m('a', {
                onclick: (e) => {
                  e.preventDefault();
                  vnode.state.voteType = 'binary';
                  vnode.state.numOutcomes = 2;
                  vnode.state.voteOutcomes = vnode.state.voteOutcomes.slice(0, 2);
                  m.redraw();
                }
              }, [
                m('.signaling-options', {
                  style: {
                    backgroundColor: (vnode.state.voteType === 'binary') ? 'grey' : 'white',
                  }
                }, [
                  m('h4', 'Binary'),
                ]),
              ]),
            ]),
            m('.new-signaling-right.col-sm-3', [
              m('a', {
                onclick: (e) => {
                  e.preventDefault();
                  vnode.state.voteType = 'multioption';
                  if (vnode.state.numOutcomes < 3) vnode.state.numOutcomes += 1;
                  m.redraw();
                }
              }, [
                m('.signaling-options', {
                  style: {
                    backgroundColor: (vnode.state.voteType === 'multioption') ? 'grey' : 'white',
                  }
                }, [
                  m('h4', 'Multi option'),
                ]),
              ])
            ]),
            m('.new-signaling-right.col-sm-3', [
              m('a', {
                onclick: (e) => {
                  e.preventDefault();
                  vnode.state.voteType = 'rankedchoice';
                  if (vnode.state.numOutcomes < 3) vnode.state.numOutcomes += 1;
                  m.redraw();
                }
              }, [
                m('.signaling-options', {
                  style: {
                    backgroundColor: (vnode.state.voteType === 'rankedchoice') ? 'grey' : 'white',
                  }
                }, [
                  m('h4', 'Ranked choice'),
                ]),
              ]),
            ]),
          ]),
          // Add vote outcome view
          m('.row', [
            m('button', {
              onclick: (e) => {
                e.preventDefault();
                vnode.state.numOutcomes += 1;
                vnode.state.voteType = 'multioption';
                m.redraw();
              }
            }, 'Add another option'),
            (vnode.state.numOutcomes > 2) && m('button', {
              onclick: (e) => {
                e.preventDefault();
                vnode.state.voteOutcomes = vnode.state.voteOutcomes.slice(0, vnode.state.voteOutcomes.length - 1);
                vnode.state.numOutcomes = vnode.state.voteOutcomes.length;
                if (vnode.state.numOutcomes === 2) vnode.state.voteType = 'binary';
                m.redraw();
              }
            }, 'Remove one option'),
          ]),
          m('.row', proposalOutcomeOptions),
          m('.row', [
            m('.new-signaling-left.col-sm-1', [
              author && m(User, { user: author, avatarOnly: true, avatarSize: 48 }),
            ]),
            m('.new-signaling-center.col-sm-8', [
              m(TextInputFormField, {
                options: {
                  name: 'title',
                  placeholder: 'Enter a title',
                  disabled: !author,
                  autocomplete: 'off',
                  oncreate: (vnode) => $(vnode.dom).focus(),
                },
                callback: (result) => {
                  vnode.state.form.title = result;
                }
              }),
              m(TextareaFormField, {
                options: {
                  name: 'description',
                  placeholder: 'Enter a description',
                  disabled: !author,
                },
                callback: (result) => {
                  vnode.state.form.description = result;
                }
              }),
              m('.actions', [
                m('button', {
                  class: !author ? 'disabled' : '',
                  type: 'submit',
                  onclick: (e) => {
                    e.preventDefault();
                    newThread();
                  }
                }, author ? 'Create signaling proposal' : 'Setup required'),
                vnode.state.error && m('.error-message', vnode.state.error),
              ]),
            ]),
            m('.new-signaling-right.col-sm-3', [
              m('h3', 'Signaling Proposal'),
              m('.signaling-options', [
                m('h4', 'Proposal Details'),
                m('p', [
                  `Refundable bond of `,
                  `${formatCoin((app.chain as Edgeware).signaling.proposalBond)} `,
                  'to create.',
                ]),
                m('p', [
                  'After creating the proposal, you must trigger the start of voting. ',
                  'Voting will be open for ',
                  `${formatDuration(blockperiodToDuration((app.chain as Edgeware).signaling.votingPeriod))}.`,
                ]),
                m('p', [
                  'The bond is returned when voting finishes.'
                ]),
              ]),
            ]),
          ]),
        ]),
      ]
    });
  }
};

export default NewSignalingPage;
