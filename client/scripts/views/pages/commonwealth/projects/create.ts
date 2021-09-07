import m from 'mithril';
import { Input, TextArea, Form, FormLabel, FormGroup, Button, Grid, Col } from 'construct-ui';

import 'pages/new_proposal_page.scss';

import app from 'state';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import SelectToken from 'views/components/commonwealth/select_token';
import { ProjectMetaData, protocolReady } from 'controllers/chain/ethereum/commonwealth/utils';

const floatRegex = /^[0-9]*\.?[0-9]*$/;

const NewProjectForm = {
  form: { tokens: [] },
  view: (vnode) => {
    const { callback, acceptedTokens, submitting } = vnode.attrs;
    const author = app.user.activeAccount;

    if (!author) return m('div', 'Must be logged in');
    if (!callback) return m('div', 'Must have callback');
    if (!acceptedTokens) return m('div', 'No accepted Tokens');
    if (acceptedTokens.length === 0) return m('div', 'No accepted Tokens');

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
              m(FormLabel, 'Please select Accepted Tokens'),
              m(SelectToken, {
                tokens: acceptedTokens,
                selectedTokens: vnode.state.form.tokens,
                updateTokens: (tokens) => {
                  vnode.state.form.tokens = tokens;
                  console.log('==>updateTokens', vnode.state.form.tokens);
                  m.redraw();
                }
              }),
              vnode.state.error
              && vnode.state.error.id === 'acceptedTokens'
              && m('p.error-text', vnode.state.error.message),
            ]),
            // threshold
            m(FormGroup, [
              m(FormLabel, 'Threshold Amount in USD'),
              m(Input, {
                disabled: submitting,
                name: 'threshold',
                autofocus: true,
                placeholder: '',
                autocomplete: 'off',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  if (floatRegex.test(result)) {
                    vnode.state.form.threshold = result;
                    // utils.parseEther(result);
                    vnode.state.error = undefined;
                  } else {
                    vnode.state.form.threshold = '0';
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
              vnode.state.error
               && vnode.state.error.id === 'curatorFee'
               && m('p.error-text', vnode.state.error.message),
            ]),
            //  ipfsHash, cwUrl, creator, projectID
          ],
          m(FormGroup, [
            m(Button, {
              intent: 'primary',
              rounded: true,
              disabled: (
                !vnode.state.form.name
                || !vnode.state.form.beneficiary
                || !vnode.state.form.threshold
                || !vnode.state.form.curatorFee
                || submitting
              ),
              label: submitting ? 'Creating now' : 'Create a new Project',
              onclick: async (e) => {
                e.preventDefault();
                if (vnode.state.form.threshold.toString()  === '0') {
                  vnode.state.error = {
                    message: 'Can not be zero',
                    id: 'threshold'
                  };
                  m.redraw();
                } else if (vnode.state.form.tokens.length === 0) {
                  vnode.state.error = {
                    message: 'Did not select Accepted Tokens',
                    id: 'acceptedTokens'
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
                    acceptedTokens: vnode.state.form.tokens
                  };
                  vnode.attrs.callback(projectData);
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
};

const NewProjectPage: m.Component<{}, {
  submitting: boolean,
  createError: string,
  acceptedTokens: any[],
  initialized: number
}> = {
  oncreate: (vnode) => {
    vnode.state.initialized = 0;
  },
  onupdate: async (vnode) => {
    if (!protocolReady) return;

    if (vnode.state.initialized === 0) {
      vnode.state.acceptedTokens = await app.cmnProtocol.project_protocol.getAcceptedTokens();
      vnode.state.initialized = 1;
      m.redraw();
    }
  },
  view: (vnode) => {
    if (vnode.state.initialized !== 1) return m(PageLoading);
    const { acceptedTokens } = vnode.state;

    return m(Sublayout, {
      class: 'NewProposalPage',
      title: 'Create a new Project',
      showNewProposalButton: true,
    }, [
      m('.forum-container', [
        m(NewProjectForm, {
          callback: async (projectData: any) => {
            const acceptedTokenAddresses = [];
            for (let i = 0; i < projectData.acceptedTokens.length; i++) {
              const index = acceptedTokens.findIndex((at) => at.symbol === projectData.acceptedTokens[i]);
              acceptedTokenAddresses.push(acceptedTokens[index].address);
            }

            const creator = app.user.activeAccount.address;
            vnode.state.submitting = true;
            const params: ProjectMetaData = {
              name: projectData.name,
              description: projectData.description,
              creator,
              beneficiary: projectData.beneficiary,
              threshold: parseFloat(projectData.threshold),
              curatorFee: parseFloat(projectData.curatorFee),
              deadline: parseFloat(projectData.deadline),
              acceptedTokens: acceptedTokenAddresses
            };
            const res = await app.cmnProtocol.project_protocol.createProject(params);
            vnode.state.createError = res.error;
            vnode.state.submitting = false;
            m.redraw();
          },
          submitting: vnode.state.submitting,
          acceptedTokens: acceptedTokens.map((token) => token.symbol) || []
        }),
        // vnode.state.createError !== '' && m('p.error-text', vnode.state.createError)
        m('p.error-text', vnode.state.createError)
      ])
    ]);
  }
};

export default NewProjectPage;
