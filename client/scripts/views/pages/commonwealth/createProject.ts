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
                const projectData = {
                  name: vnode.state.form.name,
                  description: vnode.state.form.description,
                  address: app.user.activeAccount.address,
                  beneficiary: vnode.state.form.beneficiary,
                  threshold: vnode.state.form.threshold,
                  curatorFee: vnode.state.form.curatorFee,
                  deadline: vnode.state.form.deadline,
                }
                vnode.attrs.callback(projectData)
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

const NewProjectPage: m.Component<{ type }, { initializing: boolean, protocol: any }> = {
  oncreate: async (vnode) => {
    if (!app.chain || !app.chain.loaded) {
      vnode.state.initializing = true;
      await initChain();
      vnode.state.protocol = (app.chain as any).protocol;
      vnode.state.initializing = false;
      m.redraw();
    } else if (!vnode.state.protocol) {
      vnode.state.protocol = (app.chain as any).protocol;
      m.redraw();
    }
  },
  view: (vnode) => {
    if (vnode.state.initializing || !app.chain || !vnode.state.protocol) {
      return m(PageLoading);
    }
    const { protocol } = vnode.state;
    return m(Sublayout, {
      class: 'NewProjectPage',
      title: 'Create a new Project',
      showNewProposalButton: true,
    }, [
      m('p', 'This UI version enables only Ether now. Production version will enable multiple ERC20 tokens too'),
      m('.forum-container', [
        m(NewProjectForm, {
          callback: async(projectData: any) => {
            const author = app.user.activeAccount.address;
            const res = await protocol.createProject(
              projectData.name,
              projectData.description,
              author,
              projectData.beneficiary,
              parseInt(projectData.threshold),
              parseInt(projectData.curatorFee),
              parseInt(projectData.deadline),
              true,
              '0x01'
            );
          },
        }),
      ])
    ]);
  }
};

export default NewProjectPage;
