import 'components/commonwealth/select_token.scss';

import m from 'mithril';
import { CustomSelect, ListItem, Icon, Icons, IOption, Input, Button  } from 'construct-ui';

const SelectToken: m.Component<
  {
    tokens: string[],
    updateTokens: (tokens: string[]) => void,
    selectedTokens: string[]
  },
  {}
> = {
  view: (vnode) => {
    const { tokens, selectedTokens } = vnode.attrs;
    const options = tokens.map((symbol) => {
      return { label: symbol, value: symbol };
    });

    return m('.selectToken', [
      m('.SelectTokensField', [
        m(CustomSelect, {
          itemRender: (s) => {
            const sSymbol = (s as any).value;
            const isSelected = selectedTokens.includes(sSymbol);
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
            const sSymbol = (s as any).value;
            if (selectedTokens.includes(sSymbol)) {
              vnode.attrs.updateTokens(selectedTokens.filter((token) => token !== sSymbol));
            } else {
              vnode.attrs.updateTokens(selectedTokens.concat([sSymbol]));
            }
          }
        }),
        m(
          'p',
          { class: 'mt-1' },
          [
            m('span', 'You selected: '),
            m('span', { style: 'color: red;' }, selectedTokens.join(', ')),
          ]
        ),
      ]),
    ]);
  }
};

export default SelectToken;
