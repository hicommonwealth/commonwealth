import m from 'mithril';
import { Input, TextArea, Form, FormLabel, FormGroup, Button, Grid, Col, Spinner } from 'construct-ui';
import { utils } from 'ethers';
import { initChain, selectCommunity } from 'app';

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

    const createNewProject = async() => {
      console.log('=====>protocol', protocol);
      await protocol.createProject(
        vnode.state.form.name,
        app.user.activeAccount.address,
        vnode.state.form.beneficiary,
        vnode.state.form.threshold,
        vnode.state.form.curatorFee,
        vnode.state.form.deadline,
        true,
        null
      );
    }

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
            //  deadline
            m(FormGroup, [
              m(FormLabel, 'Deadline (in minutes'),
              m(Input, {
                disabled: true,
                value: 5,
                options: {
                  name: 'deadline',
                  placeholder: '5',
                  autofocus: true,
                },
                // oninput: (e) => {
                //   const result = (e.target as any).value;
                //   vnode.state.form.deadline = result;
                //   m.redraw();
                // },
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
            //  ipfsHash, cwUrl, creator, projectID, deadline
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
                await createNewProject();
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
      vnode.state.initializing = false;
      // app.chain.deferred = false;
      vnode.state.protocol = (app.chain as any).protocol;
      m.redraw();
    }
  },
  view: (vnode) => {
    if (!app.chain || !app.chain.loaded) {
      return m(PageLoading);
    }
    return m(Sublayout, {
      class: 'NewProjectPage',
      title: 'Create a new Project',
      showNewProposalButton: true,
    }, [
      m('.forum-container', [
        m(NewProjectForm, {
          callback: (project) => {
          },
          protocol: vnode.state.protocol,
        }),
      ])
    ]);
  }
};

export default NewProjectPage;
