import m from 'mithril';
import { Input, TextArea, Form, FormLabel, FormGroup, Button, Grid, Col } from 'construct-ui';
import BN from 'bn.js';
import { utils } from 'ethers';

import 'pages/new_proposal_page.scss';

import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import SelectToken from 'views/components/commonwealth/select_token';

import app from 'state';
import { placeholder } from 'sequelize/types/lib/operators';

const floatRegex = /^[0-9]*\.?[0-9]*$/;

const NewCollectiveForm = {
  form: {},
  view: (vnode) => {
    const callback = vnode.attrs.callback;
    const author = app.user.activeAccount;
    const submitting = vnode.attrs.submitting;

    if (!author) return m('div', 'Must be logged in');
    if (!callback) return m('div', 'Must have callback');

    return m(Form, { class: 'NewCollectiveForm' }, [
      m(Grid, [
        m(Col, [
          [
            // name
            m(FormGroup, [
              m(FormLabel, 'Collective Title'),
              m(Input, {
                options: {
                  require: true,
                  name: 'name',
                  placeholder: 'Enter a title',
                  autofocus: true
                },
                disabled: submitting,
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.name = result;
                  m.redraw();
                }
              })
            ]),
            // description
            m(FormGroup, [
              m(FormLabel, 'Collective Description'),
              m(TextArea, {
                options: {
                  name: 'description',
                  placeholder: 'Enter description of the collective',
                  autofocus: false
                },
                disabled: submitting,
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.description = result;
                  m.redraw();
                }
              })
            ]),
            // beneficiary
            m(FormGroup, [
              m(FormLabel, 'Beneficiary'),
              m(Input, {
                options: {
                  require: true,
                  name: 'beneficiary',
                  placeholder: 'Enter beneficiary address'
                },
                disabled: submitting,
                oninput: (e) => {
                  const result = (e.target as any).value;
                  if (vnode.state.form.beneficiary === result) return;
                  vnode.state.form.beneficiary = result;
                  m.redraw();
                }
              })
            ]),
            m(FormGroup, [
              m(Button, {
                intent: 'primary',
                rounded: true,
                disabled: !vnode.state.form.name || !vnode.state.form.beneficiary || submitting,
                label: submitting ? 'Creating now ...' : 'Create a new Collective',
                onclick: async (e) => {
                  e.preventDefault();

                  const collectiveData = {
                    name: vnode.state.form.name,
                    description: vnode.state.form.description,
                    address: app.user.activeAccount.address,
                    beneficiary: vnode.state.form.beneficiary
                  };
                  vnode.attrs.callback(collectiveData);
                },
                tabindex: 4,
                type: 'submit'
              })
            ])
          ]
        ])
      ])
    ]);
  }
};

const NewCollectivePage: m.Component<{}, { submitting: boolean; createError: string }> = {
  view: (vnode) => {
    if (!app.chain) {
      return m(PageLoading);
    }
    const collective_protocol = (app.chain as any).collective_protocol;
    if (!collective_protocol || !collective_protocol.initialized) {
      return m(PageLoading);
    }

    return m(
      Sublayout,
      {
        class: 'NewProposalPage',
        title: 'Create a new Collective',
        showNewProposalButton: true
      },
      [
        m('.form-container', [
          m(NewCollectiveForm, {
            callback: async (collectiveData: any) => {
              console.log('====>', collectiveData);
            },
            submitting: vnode.state.submitting
          }),
          m('p.error-text', vnode.state.createError)
        ])
      ]
    );
  }
};

export default NewCollectivePage;
