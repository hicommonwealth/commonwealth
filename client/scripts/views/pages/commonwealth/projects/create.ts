import m from 'mithril';
import { Input, TextArea, Form, FormLabel, FormGroup, Button, Grid, Col, Checkbox } from 'construct-ui';
import BN from 'bn.js';
import { utils } from 'ethers';

import 'pages/new_proposal_page.scss';

import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';

import app from 'state';

const floatRegex = /^[0-9]*\.?[0-9]*$/;

const NewProjectForm = {
  form: {},
  view: (vnode) => {
    const callback = vnode.attrs.callback;
    const author = app.user.activeAccount;
    const submitting = vnode.attrs.submitting;

    if (!author) return m('div', 'Must be logged in');
    if (!callback) return m('div', 'Must have callback');

    return m(Form, { class: 'NewProposalForm' }, [
      m(Grid, [
        m(Col, [
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
                disabled: submitting,
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
                disabled: submitting,
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.description = result;
                  m.redraw();
                },
              }),
            ]),
            //  deadline
            m(FormGroup, [
              m(FormLabel, 'Deadline (in Days)'),
              m(Input, {
                options: {
                  name: 'deadline',
                  placeholder: '1',
                  autofocus: true,
                },
                disabled: submitting,
                oninput: (e) => {
                  const result = (e.target as any).value;
                  if (floatRegex.test(result)) {
                    vnode.state.error = undefined;
                    vnode.state.form.deadline = result;
                  } else {
                    vnode.state.form.deadline = undefined;
                    vnode.state.error = {
                      message: 'Invalid input value',
                      id: 'deadline'
                    };
                  }
                  m.redraw();
                },
              }),
              vnode.state.error && vnode.state.error.id === 'deadline' && m('p.error-text', vnode.state.error.message),
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
                disabled: submitting,
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
                disabled: submitting,
                name: 'threshold',
                autofocus: true,
                placeholder: '',
                autocomplete: 'off',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  if (floatRegex.test(result)) {
                    vnode.state.form.threshold = utils.parseEther(result);
                    vnode.state.error = undefined;
                  } else {
                    vnode.state.form.threshold = undefined;
                    vnode.state.error = {
                      message: 'Invalid input value',
                      id: 'threshold'
                    };
                  }
                  m.redraw();
                },
              }),
              vnode.state.error && vnode.state.error.id === 'threshold' && m('p.error-text', vnode.state.error.message),
            ]),
            //  curatorFee
            m(FormGroup, [
              m(FormLabel, 'CuratorFee (%)'),
              m(Input, {
                options: {
                  name: 'curatorFee',
                  placeholder: 'Enter a curatorFee amount',
                },
                disabled: submitting,
                oninput: (e) => {
                  const result = (e.target as any).value;
                  if (floatRegex.test(result)) {
                    vnode.state.error = undefined;
                    vnode.state.form.curatorFee = result;
                  } else {
                    vnode.state.form.curatorFee = undefined;
                    vnode.state.error = {
                      message: 'Invalid input value',
                      id: 'curatorFee'
                    };
                  }
                  m.redraw();
                },
              }),
              vnode.state.error && vnode.state.error.id === 'curatorFee' && m('p.error-text', vnode.state.error.message),
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
                !vnode.state.form.curatorFee ||
                submitting
              ),
              label: submitting ? 'Createing now' : 'Create a new Project',
              onclick: async(e) => {
                e.preventDefault();
                if (vnode.state.form.threshold.toString()  === new BN(0).toString()) {
                  vnode.state.error = {
                    message: 'Can not be zero',
                    id: 'threshold'
                  };
                  m.redraw();
                } else {
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
                }
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

const NewProjectPage: m.Component<{ type }, { submitting: boolean, createError: string }> = {
  view: (vnode) => {
    if (!app.chain) {
      return m(PageLoading);
    }
    const protocol = (app.chain as any).protocol;
    if (!protocol || !protocol.initialized) {
      return m(PageLoading);
    }

    return m(Sublayout, {
      class: 'NewProposalPage',
      title: 'Create a new Project',
      showNewProposalButton: true,
    }, [
      m('.forum-container', [
        m(NewProjectForm, {
          callback: async(projectData: any) => {
            const author = app.user.activeAccount.address;
            vnode.state.submitting = true;
            const res = await protocol.createProject(
              projectData.name,
              projectData.description,
              author,
              projectData.beneficiary,
              projectData.threshold,
              parseFloat(projectData.curatorFee),
              parseFloat(projectData.deadline),
            );
            vnode.state.createError = res.error;
            vnode.state.submitting = false;
            m.redraw();
          },
          submitting: vnode.state.submitting,
        }),
        // vnode.state.createError !== '' && m('p.error-text', vnode.state.createError)
        m('p.error-text', vnode.state.createError)
      ])
    ]);
  }
};

export default NewProjectPage;