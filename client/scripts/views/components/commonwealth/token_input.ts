import 'components/commonwealth/token_input.scss';

import m from 'mithril';
import { CustomSelect, ListItem, Icon, Icons, IOption, Input, Button  } from 'construct-ui';

export type Token = {
  id: string;
  name: string;
  address: {
    kovan: string,
    mainnet: string,
  },
  decimals: number;
  symbol: string;
  icon_url: string;
}

const TokenInputField: m.Component<
  { tokens: Token[] },
  { token: Token, balance: number }
> = {
  view: (vnode) => {
    const { tokens } = vnode.attrs;
    const options = tokens.map(({ id, name }) => {
      return {
        label: name,
        value: id
      };
    });

    return m('.TokenInput', [
      m('.SelectTokensField', [
        m(CustomSelect, {
          defaultValue: options[0].value,
          itemRender: (item, isSelected, index) => m(ListItem, {
            contentLeft: m(Icon, {
              name: index % 2 ? Icons.FILE_PLUS : Icons.USERS
            }),
            label: (item as IOption).label,
            selected: isSelected
          }),
          options,
          onSelect: (s) => {
            const selectedToken = tokens.filter(({ id }) => id === (s as any).value)[0];
            vnode.state.token = selectedToken;
          }
        })
      ]),
      m(Input, {
        placeholder: 'Type your amount to back',
        oninput: (e) => {
          const result = (e.target as any).value;
          vnode.state.balance = result;
        }
      }),
      m(Button, {
        onclick: (e) => {
          console.log('====>token', vnode.state.token);
          console.log('====>vnode.state.balance', vnode.state.balance);
        },
        label: 'back',
      }),
    ]);
  }
};

export default TokenInputField;
