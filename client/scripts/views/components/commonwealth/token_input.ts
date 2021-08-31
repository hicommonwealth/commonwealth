import 'components/commonwealth/token_input.scss';

import m from 'mithril';
import { CustomSelect, ListItem, Icon, Icons, Input, Button  } from 'construct-ui';

const floatRegex = /^[0-9]*\.?[0-9]*$/;

const TokenInputField: m.Component<
  {
    tokens: string[],
    buttonLabel: string,
    callback: (token: string, balance: number) => void,
    actionDisabled: boolean
  },
  { token: string, balance: number, error: string }
> = {
  oncreate: (vnode) => {
    vnode.state.token = vnode.attrs.tokens[0];
    vnode.state.error = '';
    vnode.state.balance = 0;
  },
  view: (vnode) => {
    // contents for dropdown tokens
    const options = vnode.attrs.tokens.map((symbol) => {
      return { label: symbol, value: symbol };
    });

    const buttonDisabled = vnode.attrs.actionDisabled || (
      vnode.state.error && vnode.state.error !== ''
    );

    return m('div', [
      m('.TokenInput', [
        m('.SelectTokensField', [
          m(CustomSelect, {
            defaultValue: options[0].value,
            itemRender: (s) => {
              const sSymbol = (s as any).value;
              const isSelected = sSymbol === vnode.state.token;
              return m(ListItem, {
                contentLeft: isSelected && m(Icon, {
                  name: Icons.CHECK
                }),
                label: sSymbol,
                selected: isSelected
              });
            },
            options,
            onSelect: (s) => {
              vnode.state.token = (s as any).value;
            }
          })
        ]),
        m(Input, {
          placeholder: 'Type your amount to back',
          oninput: (e) => {
            const result = (e.target as any).value;
            if (floatRegex.test(result)) {
              vnode.state.balance = parseFloat(result);
              vnode.state.error = '';
            } else {
              vnode.state.balance = 0;
              vnode.state.error = 'Invalid amount value';
            }
          }
        }),
        m(Button, {
          disabled: buttonDisabled,
          onclick: async (e) => {
            e.preventDefault();
            if (vnode.state.balance <= 0) {
              vnode.state.error = 'Invalid amount value';
            } else if (vnode.state.error === '') {
              await vnode.attrs.callback(vnode.state.token, vnode.state.balance);
            }
          },
          label: vnode.attrs.buttonLabel || 'back',
        }),
      ]),
      vnode.state.error
      && vnode.state.error !== ''
      && m(
        'p',
        { style: 'color: red; width: 100%; text-align: center; margin-top: 5px' },
        vnode.state.error
      ),
    ]);
  }
};

export default TokenInputField;
