import m from 'mithril';
import {
  Input,
  TextArea,
  Form,
  FormLabel,
  FormGroup,
  Button,
  Grid,
  Col,
} from 'construct-ui';

import 'pages/commonwealth/new.scss';

import SelectToken from 'views/components/commonwealth/select_token';

const FirstStepForm = {
  form: { tokens: [] },
  view: (vnode) => {
    const { acceptedTokens } = vnode.attrs;

    return m(Form, { class: 'NewProjectForm' }, [
      m(Grid, [
        m(Col, [
          [
            //  name
            m(FormGroup, [
              m(FormLabel, 'Collective Title'),
              m(Input, {
                options: {
                  name: 'name',
                  placeholder: 'Enter a title',
                  autofocus: true,
                },
                oninput: (e) => {
                  const result = e.target.value;
                  vnode.state.form.name = result;
                  m.redraw();
                },
              }),
            ]),
            // description
            m(FormGroup, [
              m(FormLabel, 'Collective Description'),
              m(TextArea, {
                options: {
                  name: 'description',
                  placeholder: 'Enter description of the collective',
                  autofocus: false,
                },
                oninput: (e) => {
                  const result = e.target.value;
                  vnode.state.form.description = result;
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
                  const result = e.target.value;
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
                  m.redraw();
                },
              }),
              vnode.state.error &&
                vnode.state.error.id === 'acceptedTokens' &&
                m('p.error-text', vnode.state.error.message),
            ]),
          ],
          m(FormGroup, [
            m(Button, {
              intent: 'primary',
              rounded: true,
              disabled:
                !vnode.state.form.name ||
                !vnode.state.form.beneficiary ||
                vnode.state.form.tokens.length === 0,
              label: 'Create a new Collective',
              onclick: async (e) => {
                e.preventDefault();
                if (vnode.state.form.tokens.length === 0) {
                  vnode.state.error = {
                    message: 'Did not select Accepted Tokens',
                    id: 'acceptedTokens',
                  };
                  m.redraw();
                } else {
                  const collectiveData = {
                    name: vnode.state.form.name,
                    description: vnode.state.form.description,
                    beneficiary: vnode.state.form.beneficiary,
                    acceptedTokens: vnode.state.form.tokens,
                  };
                  vnode.attrs.callback(collectiveData);
                }
              },
              tabindex: 4,
              type: 'submit',
            }),
          ]),
        ]),
      ]),
    ]);
  },
};

export default FirstStepForm;
