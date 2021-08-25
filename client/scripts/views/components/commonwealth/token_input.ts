import 'components/commonwealth/token_input.scss';

import m from 'mithril';
import { Input, Button } from 'construct-ui';
import SelectTokensField from './select_tokens';

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

export const tokens = [
  {
    id: 'ETH',
    name: 'ETH',
    address: {
      kovan: '',
      mainnet: ''
    },
    decimals: 18,
    symbol: 'ETH',
    icon_url: ''
  },
  {
    id: 'USDT',
    name: 'USDT',
    address: {
      kovan: '',
      mainnet: ''
    },
    decimals: 6,
    symbol: 'USDT',
    icon_url: ''
  },
];

interface IAttrs {
}

interface IState {
  token: Token,
  balance: number,
}

const TokenInputField: m.Component<IAttrs, IState> = {
  view: (vnode) => {
    return m('.TokenInput', [
      m(SelectTokensField, {
        defaultToken: vnode.state.token || tokens[0],
        onChange: (newToken: Token) => {
          vnode.state.token = newToken;
        }
      }),
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
