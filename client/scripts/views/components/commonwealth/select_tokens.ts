import 'components/commonwealth/select_tokens.scss';

import m from 'mithril';
import { CustomSelect, ListItem, Icon, Icons, IOption } from 'construct-ui';
import { Token, tokens } from './token_input';

interface IAttrs {
  defaultToken?: Token;
  onChange: (token: Token) => void
}

interface IState {
  showDropdown: boolean;
}

const SelectTokensField: m.Component<IAttrs, IState> = {
  view: (vnode) => {
    const { defaultToken } = vnode.attrs;
    const options = tokens.map(({ id, name }) => {
      return {
        label: name,
        value: id
      };
    });

    return m('.SelectTokensField', [
      m(CustomSelect, {
        defaultValue: defaultToken ? defaultToken.id : options[0].value,
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
          vnode.attrs.onChange(selectedToken);
        }
      })
    ]);
  }
};

export default SelectTokensField;
