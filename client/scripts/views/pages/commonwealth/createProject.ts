import m from 'mithril';
import { Input, TextArea, Form, FormLabel, FormGroup, Button, Grid, Col, Checkbox } from 'construct-ui';
import { utils } from 'ethers';
import { initChain, selectCommunity } from 'app';
import BN from 'bn.js';

import 'pages/new_proposal_page.scss';

import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';

import app from 'state';


const NewProjectForm = {
  form: {},
  view: (vnode) => {
    const callback = vnode.attrs.callback;
    const author = app.user.activeAccount;
    const protocol = vnode.attrs.protocol;

    if (!author) return m('div', 'Must be logged in');
    if (!callback) return m('div', 'Must have callback');
    if (!protocol) return m('div', 'Chain is not fully loaded yet');

    return m(Form, { class: 'NewProposalForm' }, [
      m(Grid, [
        m(Col, [
          vnode.state.error && m('.error', vnode.state.error.message),
          [
            //  name
            m(FormGroup, [
              m(FormLabel, 'Project Title'),
              m(Input, {
                options: {
                  name: 'name',
                  placeholder: 'Enter a title',
                  autofocus: true,
                },
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.name = result;
                  m.redraw();
                },
              }),
            ]),
            // description
            m(FormGroup, [
              m(FormLabel, 'Project Description'),
              m(TextArea, {
                options: {
                  name: 'description',
                  placeholder: 'Enter description of the project',
                  autofocus: false,
                },
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.description = result;
                  m.redraw();
                },
              }),
            ]),
            //  deadline
            m(FormGroup, [
              m(FormLabel, 'Deadline (in hours)'),
              m(Input, {
                options: {
                  name: 'deadline',
                  placeholder: '1',
                  autofocus: true,
                },
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.deadline = parseInt(result) * 24 * 60 * 60;
                  m.redraw();
                },
              }),
            ]),
            // beneficiary
            m(FormGroup, [
              m(FormLabel, 'Beneficiary'),
              m(Input, {
                options: {
                  require: true,
                  name: 'beneficiary',
                  placeholder: 'Enter a description',
                },
                oninput: (e) => {
                  const result = (e.target as any).value;
                  if (vnode.state.form.beneficiary === result) return;
                  vnode.state.form.beneficiary = result;
                  m.redraw();
                },
              }),
            ]),
            // acceptedToken
            m(FormGroup, [
              m(FormLabel, 'Backer with Ether'),
              m(Checkbox, {
                checked: true,
                disabled: true,
                style: { margin: '0 0 0 5px' },
                onchange: async (e) => {
                  // e.preventDefault();
                  // m.redraw();
                }
              }),
            ]),
            // threshold
            m(FormGroup, [
              m(FormLabel, `Threshold Amount (${app.chain.chain.denom})`),
              m(Input, {
                name: 'threshold',
                autofocus: true,
                placeholder: 'Amount of threshold',
                autocomplete: 'off',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.threshold = app.chain.chain.coins(parseFloat(result), true);
                  m.redraw();
                },
              })
            ]),
            //  curatorFee
            m(FormGroup, [
              m(FormLabel, 'CuratorFee (%)'),
              m(Input, {
                options: {
                  name: 'curatorFee',
                  placeholder: 'Enter a curatorFee amount',
                },
                oninput: (e) => {
                  const result = (e.target as any).value;
                  if (vnode.state.form.curatorFee === result) return;
                  vnode.state.form.curatorFee = result;
                  m.redraw();
                },
              }),
            ]),
            //  ipfsHash, cwUrl, creator, projectID
          ],
          m(FormGroup, [
            m(Button, {
              intent: 'primary',
              rounded: true,
              disabled: (
                !vnode.state.form.name ||
                !vnode.state.form.beneficiary ||
                !vnode.state.form.threshold ||
                !vnode.state.form.curatorFee
              ),
              label: 'Create a new Project',
              onclick: async(e) => {
                e.preventDefault();
                // await createNewProject();
                await protocol.createProject(
                  vnode.state.form.name,
                  vnode.state.form.description,
                  app.user.activeAccount.address,
                  vnode.state.form.beneficiary,
                  vnode.state.form.threshold,
                  vnode.state.form.curatorFee,
                  null,   // vnode.state.form.deadline,
                  true,
                  null
                );
              },
              tabindex: 4,
              type: 'submit',
            }),
          ]),
        ])
      ]),
    ]);
  }
}

const NewProjectPage: m.Component<{ type }, { initializing: boolean }> = {
  oncreate: async (vnode) => {
    if (!app.chain || !app.chain.loaded) {
      vnode.state.initializing = true;
      await initChain();
      // app.chain.deferred = false;
      vnode.state.initializing = false;
      m.redraw();
    }
  },
  view: (vnode) => {
    if (vnode.state.initializing || !app.chain || !app.chain.loaded || !(app.chain as any).protocol) {
      return m(PageLoading);
    }
    return m(Sublayout, {
      class: 'NewProjectPage',
      title: 'Create a new Project',
      showNewProposalButton: true,
    }, [
      m('p', 'This UI version enables only Ether now. Production version will enable multiple ERC20 tokens too'),
      m('p', []),
      m('.forum-container', [
        m(NewProjectForm, {
          callback: (project) => {
          },
          protocol: (app.chain as any).protocol,
        }),
      ])
    ]);
  }
};

export default NewProjectPage;
