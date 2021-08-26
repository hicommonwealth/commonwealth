import 'components/commonwealth/select_token.scss';

import m from 'mithril';
import { CustomSelect, ListItem, Icon, Icons, IOption, Input, Button  } from 'construct-ui';
import { Token } from './token_input';

const SelectToken: m.Component<
  { tokens: Token[], updateTokens: (tokens: Token[]) => void, selectedTokens: Token[] },
  {}
> = {
  view: (vnode) => {
    const { tokens, selectedTokens } = vnode.attrs;
    const options = tokens.map(({ symbol, name }) => {
      return {
        label: name,
        value: symbol
      };
    });

    return m('.selectToken', [
      m('.SelectTokensField', [
        m(CustomSelect, {
          defaultValue: options[0].value,
          itemRender: (item) => {
            const label = (item as IOption).label as string;
            const isSelected = (selectedTokens || []).map(({ symbol }) => symbol).includes(label);
            return m(ListItem, {
              contentLeft: isSelected && m(Icon, {
                name: Icons.CHECK
              }),
              label,
              selected: isSelected
            });
          },
          options,
          onSelect: (s) => {
            const newToken = tokens.filter(({ symbol }) => symbol === (s as any).value)[0];
            const selectedTokenSymbols = (selectedTokens || []).map(({ symbol }) => symbol);
            if (selectedTokenSymbols.includes(newToken.symbol)) {
              vnode.attrs.updateTokens(
                selectedTokens.filter(({ symbol }) => symbol !== newToken.symbol)
              );
            } else {
              vnode.attrs.updateTokens(selectedTokens.concat([newToken]));
            }
          }
        })
      ]),
    ]);
  }
};

export default SelectToken;
