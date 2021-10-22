import m from 'mithril';
import {
  Input,
  Form,
  FormLabel,
  FormGroup,
  Button,
  Grid,
  Col,
} from 'construct-ui';

import 'pages/commonwealth/new.scss';

const isValid = (data, keys) => {
  let valide = true;
  for (let i = 0; i < keys.length; i++) {
    if (!data[keys[i]] || data[keys[i]] === '') {
      valide = false;
    }
  }
  return valide;
};

const SecondStepForm = {
  form: { tokens: [] },
  view: (vnode) => {
    const { selectedTokens, submitting } = vnode.attrs;

    const StrategyComps = (selectedTokens || []).map((sToken) =>
      m(FormGroup, [
        m(FormLabel, `${sToken} Strategy Address`),
        m(Input, {
          options: {
            name: sToken,
            placeholder: 'Enter Strategy address for this token',
          },
          disabled: submitting,
          oninput: (e) => {
            const result = e.target.value;
            vnode.state.form[sToken] = result;
            m.redraw();
          },
        }),
      ])
    );

    return m(Form, { class: 'NewProjectForm' }, [
      m(Grid, [
        m(Col, [
          [StrategyComps],
          m(FormGroup, [
            m(Button, {
              intent: 'primary',
              rounded: true,
              disabled:
                !isValid(vnode.state.form, selectedTokens) || submitting,
              label: submitting
                ? 'Registering now'
                : 'Register Collective Strategies',

              onclick: (e) => {
                e.preventDefault();
                const strategies = [];
                for (let i = 0; i < selectedTokens.length; i++) {
                  strategies.push(vnode.state.form[selectedTokens[i]]);
                }
                vnode.attrs.callback(strategies);
              },
              tabindex: 4,
              type: 'submit',
            }),
          ]),
          m('p.error-text', 'Please fill all valid token strategies'),
        ]),
      ]),
    ]);
  },
};

export default SecondStepForm;
